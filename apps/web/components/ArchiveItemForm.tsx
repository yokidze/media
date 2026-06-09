'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';
import { FileDropzone } from '@/components/FileDropzone';
import { DatePickerInput } from '@/components/DatePickerInput';
import { StyledSelect } from '@/components/StyledSelect';
import type { ArchiveItem, MaterialType } from '@/lib/types';
import { toSectionFromMaterialType } from '@/lib/archive';
import { useLanguage } from '@/components/LanguageProvider';

const buildFormSchema = (language: 'rus' | 'kaz') =>
  z.object({
    materialType: z.string().min(1, language === 'kaz' ? 'Материал түрін таңдаңыз.' : 'Выберите тип материала.'),
    categoryId: z.string().min(1, language === 'kaz' ? 'Санатты таңдаңыз.' : 'Выберите категорию.'),
    title: z
      .string()
      .trim()
      .min(2, language === 'kaz' ? 'Материал атауын енгізіңіз (кемі 2 таңба).' : 'Введите название материала (минимум 2 символа).')
      .max(180, language === 'kaz' ? 'Атау тым ұзын.' : 'Название слишком длинное.'),
    description: z
      .string()
      .trim()
      .min(10, language === 'kaz' ? 'Қысқаша сипаттама қосыңыз (кемі 10 таңба).' : 'Добавьте краткое описание (минимум 10 символов).')
      .max(2000, language === 'kaz' ? 'Сипаттама тым ұзын.' : 'Описание слишком длинное.'),
    publicationDate: z.string().min(1, language === 'kaz' ? 'Жариялану күнін көрсетіңіз.' : 'Укажите дату публикации.'),
    teacherName: z.string().trim().max(120, language === 'kaz' ? 'Оқытушының аты тым ұзын.' : 'Слишком длинное имя преподавателя.').optional(),
    departmentName: z.string().trim().max(120, language === 'kaz' ? 'Бөлім атауы тым ұзын.' : 'Слишком длинное название отделения.').optional(),
    externalUrl: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^https?:\/\//i.test(value), language === 'kaz' ? 'Сілтеме http:// немесе https:// арқылы басталуы керек.' : 'Ссылка должна начинаться с http:// или https://.')
  });

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

interface ArchiveItemFormProps {
  itemId?: string;
}

interface ExistingMeta {
  tags: string[];
  accessLevel: ArchiveItem['accessLevel'];
  status: ArchiveItem['status'];
  language: string;
  issueNumber: string | null;
  keywords: string[];
  textBody: string | null;
  existingFileCount: number;
}

interface MeResponse {
  fullName: string;
  department: string | null;
  roles: string[];
}

interface FormOptionsResponse {
  categories: Array<{ id: string; name: string; nameRu?: string | null; nameKaz?: string | null }>;
  materialTypes: string[];
}

const MARKERS = {
  link: ['Внешняя ссылка:', 'Сыртқы сілтеме:'],
  teacher: ['Преподаватель:', 'Оқытушы:'],
  department: ['Отделение:', 'Бөлім:']
} as const;

const friendlyError = (error: unknown, language: 'rus' | 'kaz'): string => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('csrf')) {
    return language === 'kaz' ? 'Сессия жаңартылды. Бетті жаңартып, қайта көріңіз.' : 'Сессия обновилась. Обновите страницу и попробуйте снова.';
  }

  if (message.includes('unique') || message.includes('already exists')) {
    return language === 'kaz'
      ? 'Мұндай атаумен материал бұрыннан бар. Атауды нақтылап, қайта сақтаңыз.'
      : 'Материал с таким названием уже существует. Уточните название и повторите сохранение.';
  }

  if (message.includes('forbidden')) {
    return language === 'kaz' ? 'Материал қосуға құқығыңыз жоқ.' : 'У вас нет прав на добавление материалов.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return language === 'kaz' ? 'Сервермен байланысу мүмкін болмады. Байланысты тексеріп, қайта көріңіз.' : 'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.';
  }

  return language === 'kaz' ? 'Материалды сақтау мүмкін болмады. Өрістерді тексеріп, қайта көріңіз.' : 'Не удалось сохранить материал. Проверьте поля формы и повторите попытку.';
};

const parseTextMeta = (
  textContent?: string | null
): { externalUrl: string; teacherName: string; departmentName: string; textBody: string | null } => {
  if (!textContent) return { externalUrl: '', teacherName: '', departmentName: '', textBody: null };

  const lines = textContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let externalUrl = '';
  let teacherName = '';
  let departmentName = '';
  const plainLines: string[] = [];
  const findMarker = (line: string, markers: readonly string[]): string | null => {
    const marker = markers.find((entry) => line.startsWith(entry));
    if (!marker) return null;
    return line.slice(marker.length).trim();
  };

  lines.forEach((line) => {
    const parsedLink = findMarker(line, MARKERS.link);
    if (!externalUrl && parsedLink !== null) {
      externalUrl = parsedLink;
      return;
    }
    const parsedTeacher = findMarker(line, MARKERS.teacher);
    if (!teacherName && parsedTeacher !== null) {
      teacherName = parsedTeacher;
      return;
    }
    const parsedDepartment = findMarker(line, MARKERS.department);
    if (!departmentName && parsedDepartment !== null) {
      departmentName = parsedDepartment;
      return;
    }

    plainLines.push(line);
  });

  return {
    externalUrl,
    teacherName,
    departmentName,
    textBody: plainLines.length > 0 ? plainLines.join('\n') : null
  };
};

const composeTextContent = (values: FormValues, language: 'rus' | 'kaz', textBody?: string | null): string | null => {
  const chunks: string[] = [];
  const teacher = values.teacherName?.trim();
  const department = values.departmentName?.trim();
  const externalUrl = values.externalUrl?.trim();

  const teacherMarker = language === 'kaz' ? MARKERS.teacher[1] : MARKERS.teacher[0];
  const departmentMarker = language === 'kaz' ? MARKERS.department[1] : MARKERS.department[0];
  const linkMarker = language === 'kaz' ? MARKERS.link[1] : MARKERS.link[0];

  if (teacher) chunks.push(`${teacherMarker} ${teacher}`);
  if (department) chunks.push(`${departmentMarker} ${department}`);
  if (externalUrl) chunks.push(`${linkMarker} ${externalUrl}`);
  if (textBody?.trim()) chunks.push(textBody.trim());

  return chunks.length > 0 ? chunks.join('\n\n') : null;
};

const isMaterialType = (value: string): value is MaterialType => {
  return ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'UMKD', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'].includes(value);
};

export function ArchiveItemForm({ itemId }: ArchiveItemFormProps): React.JSX.Element {
  const router = useRouter();
  const { categoryLabel, language, materialTypeLabel } = useLanguage();
  const formSchema = useMemo(() => buildFormSchema(language), [language]);

  const [files, setFiles] = useState<File[]>([]);
  const [existingMeta, setExistingMeta] = useState<ExistingMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [options, setOptions] = useState<FormOptionsResponse | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialType: '',
      categoryId: '',
      title: '',
      description: '',
      publicationDate: '',
      teacherName: '',
      departmentName: '',
      externalUrl: ''
    }
  });

  const values = watch();

  useEffect(() => {
    Promise.all([apiFetch<MeResponse>('/auth/me'), apiFetch<FormOptionsResponse>('/filters/options')])
      .then(([me, loadedOptions]) => {
        const roles = Array.isArray(me.roles) ? me.roles : [];
        const allowed = roles.includes('STAFF') || roles.includes('ADMIN');

        setCanCreate(allowed);
        setOptions({
          categories: loadedOptions.categories ?? [],
          materialTypes: loadedOptions.materialTypes ?? []
        });

        if (allowed && !itemId) {
          setValue('teacherName', me.fullName ?? '');
          setValue('departmentName', me.department ?? '');
        }
      })
      .catch(() => {
        setCanCreate(false);
        setError(language === 'kaz' ? 'Форма параметрлерін жүктеу мүмкін болмады. Бетті жаңартып, қайта көріңіз.' : 'Не удалось загрузить параметры формы. Обновите страницу и попробуйте снова.');
      });
  }, [itemId, setValue, language]);

  useEffect(() => {
    if (!itemId) return;

    apiFetch<ArchiveItem>(`/archive-items/${itemId}`)
      .then((item) => {
        const meta = parseTextMeta(item.textContent);

        setValue('materialType', item.materialType);
        setValue('categoryId', item.category?.id ?? '');
        setValue('title', item.title);
        setValue('description', item.description);
        setValue('publicationDate', item.publicationDate ? item.publicationDate.slice(0, 10) : '');
        setValue('externalUrl', meta.externalUrl);
        if (meta.teacherName) setValue('teacherName', meta.teacherName);
        if (meta.departmentName) setValue('departmentName', meta.departmentName);

        setExistingMeta({
          tags: item.tags.map((tag) => tag.id),
          accessLevel: item.accessLevel,
          status: item.status,
          language: item.language,
          issueNumber: item.issueNumber,
          keywords: item.keywords,
          textBody: meta.textBody,
          existingFileCount: item.files.length
        });
      })
      .catch(() => {
        setError(language === 'kaz' ? 'Өңдеу үшін материалды жүктеу мүмкін болмады.' : 'Не удалось загрузить материал для редактирования.');
      });
  }, [itemId, setValue, language]);

  const hasAttachment = useMemo(() => {
    return Boolean(values.externalUrl?.trim()) || files.length > 0 || ((existingMeta?.existingFileCount ?? 0) > 0 && Boolean(itemId));
  }, [values.externalUrl, files.length, existingMeta?.existingFileCount, itemId]);

  const onSubmit = handleSubmit(async (formValues, event) => {
    setError(null);

    if (!hasAttachment) {
      setError(language === 'kaz' ? 'Материалды сақтау үшін файл немесе сыртқы сілтеме қосыңыз.' : 'Добавьте файл или внешнюю ссылку, чтобы сохранить материал.');
      return;
    }

    if (!isMaterialType(formValues.materialType)) {
      setError(language === 'kaz' ? 'Материалдың қате түрі таңдалды. Бетті жаңартып, қайта көріңіз.' : 'Выбран некорректный тип материала. Обновите страницу и попробуйте снова.');
      return;
    }

    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null;
    const requestedStatus = submitter?.value === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

    setIsSubmitting(true);

    try {
      const publicationDate = new Date(formValues.publicationDate);
      const archiveYear = Number.isNaN(publicationDate.getTime()) ? null : publicationDate.getFullYear();

      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        materialType: formValues.materialType,
        contentSection: toSectionFromMaterialType(formValues.materialType),
        categoryId: formValues.categoryId,
        publicationDate: publicationDate.toISOString(),
        language: existingMeta?.language ?? 'ru',
        archiveYear,
        issueNumber: existingMeta?.issueNumber ?? null,
        accessLevel: existingMeta?.accessLevel ?? 'PUBLIC',
        status: requestedStatus,
        tags: existingMeta?.tags ?? [],
        keywords: existingMeta?.keywords ?? [],
        alphabetLetter: formValues.title.trim().charAt(0).toUpperCase(),
        textContent: composeTextContent(formValues, language, existingMeta?.textBody ?? null)
      };

      const savedItem = itemId
        ? await apiFetch<ArchiveItem>(`/archive-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await apiFetch<ArchiveItem>('/archive-items', { method: 'POST', body: JSON.stringify(payload) });

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        await apiFetch(`/archive-items/${savedItem.id}/files`, {
          method: 'POST',
          body: formData,
          headers: {}
        });
      }

      router.push('/admin/items');
      router.refresh();
    } catch (requestError) {
      setError(friendlyError(requestError, language));
    } finally {
      setIsSubmitting(false);
    }
  });

  if (canCreate === null || !options) {
    return <div className="card p-6 text-center text-slate-500">{language === 'kaz' ? 'Материал қосу формасы жүктелуде...' : 'Загружаем форму добавления материала...'}</div>;
  }

  if (!canCreate) {
    return <div className="card p-6 text-center text-red-700">{language === 'kaz' ? 'Материал қосуға құқығыңыз жоқ.' : 'У вас нет прав для добавления материалов.'}</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="card p-5">
        <h2 className="text-xl font-semibold">{language === 'kaz' ? 'Материал түрі' : 'Тип материала'} <span className="text-red-600">*</span></h2>
        <p className="mt-1 text-sm text-slate-600">{language === 'kaz' ? 'Жүйеде қолжетімді материал түрін таңдаңыз.' : 'Выберите тип материала из доступных в системе.'}</p>

        <div className="mt-4 max-w-xl">
          <Controller
            control={control}
            name="materialType"
            render={({ field }) => (
              <StyledSelect
                value={field.value ?? ''}
                placeholder={language === 'kaz' ? 'Материал түрін таңдаңыз' : 'Выберите тип материала'}
                options={options.materialTypes.map((type) => ({
                  value: type,
                  label: isMaterialType(type) ? materialTypeLabel(type) : type
                }))}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        {errors.materialType && <p className="mt-2 text-sm text-red-600">{errors.materialType.message}</p>}
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">{language === 'kaz' ? 'Санат' : 'Категория'} <span className="text-red-600">*</span></h2>
        <p className="mt-1 text-sm text-slate-600">{language === 'kaz' ? 'Архивтегі қолжетімді санатты таңдаңыз.' : 'Выберите категорию из доступных в архиве.'}</p>

        <div className="mt-4 max-w-xl">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <StyledSelect
                value={field.value ?? ''}
                placeholder={language === 'kaz' ? 'Санатты таңдаңыз' : 'Выберите категорию'}
                options={options.categories.map((category) => ({
                  value: category.id,
                  label: categoryLabel(category)
                }))}
                onChange={field.onChange}
              />
            )}
          />
          {errors.categoryId && <p className="mt-2 text-sm text-red-600">{errors.categoryId.message}</p>}
        </div>
      </section>

      <section className="card grid gap-4 p-5">
        <h2 className="text-xl font-semibold">{language === 'kaz' ? 'Негізгі ақпарат' : 'Основная информация'}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {language === 'kaz' ? 'Материал атауы' : 'Название материала'} <span className="text-red-600">*</span>
          </label>
          <input className="input" placeholder={language === 'kaz' ? 'Мысалы: Физикадан ашық сабақ' : 'Например: Открытый урок по физике'} {...register('title')} />
          <p className="mt-1 text-xs text-slate-500">{language === 'kaz' ? 'Жылдам іздеуге арналған қысқа және түсінікті атау.' : 'Короткое и понятное название для быстрого поиска.'}</p>
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="textarea-shell">
          <label className="mb-1 block text-sm font-medium">
            {language === 'kaz' ? 'Сипаттама' : 'Описание'} <span className="text-red-600">*</span>
          </label>
          <textarea
            className="input textarea-field min-h-[140px]"
            placeholder={language === 'kaz' ? 'Материал мазмұнын қысқаша сипаттаңыз.' : 'Кратко опишите содержание материала.'}
            {...register('description')}
          />
          <p className="mt-1 text-xs text-slate-500">{language === 'kaz' ? '2-4 сөйлем: материал не туралы және кімге пайдалы.' : '2-4 предложения: о чём материал и кому он полезен.'}</p>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {language === 'kaz' ? 'Күні' : 'Дата'} <span className="text-red-600">*</span>
            </label>
            <Controller
              control={control}
              name="publicationDate"
              render={({ field }) => <DatePickerInput value={field.value ?? ''} onChange={field.onChange} />}
            />
            {errors.publicationDate && <p className="mt-1 text-sm text-red-600">{errors.publicationDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{language === 'kaz' ? 'Автор / оқытушы' : 'Автор / преподаватель'}</label>
            <input className="input" placeholder={language === 'kaz' ? 'Оқытушының Т.А.Ә' : 'ФИО преподавателя'} {...register('teacherName')} />
            {errors.teacherName && <p className="mt-1 text-sm text-red-600">{errors.teacherName.message}</p>}
          </div>
        </div>

        <div className="max-w-md">
          <label className="mb-1 block text-sm font-medium">{language === 'kaz' ? 'Бөлім / кафедра' : 'Подразделение / отделение'}</label>
          <input className="input" placeholder={language === 'kaz' ? 'Мысалы: IT циклдік комиссиясы' : 'Например: Цикловая комиссия ИТ'} {...register('departmentName')} />
          {errors.departmentName && <p className="mt-1 text-sm text-red-600">{errors.departmentName.message}</p>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-semibold">{language === 'kaz' ? 'Файл немесе сілтеме' : 'Файл или ссылка'} <span className="text-red-600">*</span></h2>
        <p className="mt-1 text-sm text-slate-600">{language === 'kaz' ? 'Файлды (фото/видеомен бірге) жүктеңіз немесе сыртқы сілтеме енгізіңіз.' : 'Загрузите файл (включая фото/видео) или вставьте внешнюю ссылку.'}</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{language === 'kaz' ? 'Файл жүктеу' : 'Загрузка файла'}</p>
          <div className="mt-3">
            <FileDropzone files={files} onFilesChange={setFiles} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{language === 'kaz' ? 'Сыртқы сілтеме' : 'Внешняя ссылка'}</p>
          <div className="mt-3">
            <input className="input" placeholder="https://..." {...register('externalUrl')} />
          </div>
          {errors.externalUrl && <p className="mt-1 text-sm text-red-600">{errors.externalUrl.message}</p>}
        </div>

        {(existingMeta?.existingFileCount ?? 0) > 0 && itemId && (
          <p className="mt-3 text-xs text-slate-500">{language === 'kaz' ? `Материалда тіркелген файлдар бар: ${existingMeta?.existingFileCount}.` : `У материала уже есть прикреплённые файлы: ${existingMeta?.existingFileCount}.`}</p>
        )}
      </section>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-xs text-slate-500">{language === 'kaz' ? 'Жұлдызшамен белгіленген өрістер міндетті.' : 'Поля со звёздочкой обязательны для сохранения.'}</p>

        <div className="flex flex-wrap gap-2">
          <button type="submit" value="DRAFT" className="btn btn-secondary" disabled={isSubmitting}>
            {language === 'kaz' ? 'Жоба ретінде сақтау' : 'Сохранить как черновик'}
          </button>
          <button type="submit" value="PUBLISHED" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (language === 'kaz' ? 'Сақталуда...' : 'Сохраняем...') : itemId ? language === 'kaz' ? 'Сақтау' : 'Сохранить' : language === 'kaz' ? 'Жариялау' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </form>
  );
}
