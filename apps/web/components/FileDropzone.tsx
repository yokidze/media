'use client';

import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatBytes } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileDropzone({ files, onFilesChange }: FileDropzoneProps): React.JSX.Element {
  const { language } = useLanguage();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles) => {
      onFilesChange([...files, ...acceptedFiles]);
    }
  });

  const totalSize = useMemo(() => files.reduce((acc, file) => acc + file.size, 0), [files]);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-semibold text-slate-700">
          {language === 'kaz' ? 'Файлдарды осында сүйреңіз немесе таңдау үшін басыңыз' : 'Перетащите файлы сюда или нажмите для выбора'}
        </p>
        <p className="mt-1 text-sm text-slate-500">{language === 'kaz' ? 'Қолданылатын пішімдер: PDF, DOCX, JPG, PNG, MP4, MP3, ZIP' : 'Поддерживаются: PDF, DOCX, JPG, PNG, MP4, MP3, ZIP'}</p>
      </div>

      {files.length > 0 && (
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{language === 'kaz' ? `Таңдалған файлдар: ${files.length}` : `Выбрано файлов: ${files.length}`}</p>
            <button type="button" className="text-xs font-semibold text-slate-600 hover:text-slate-900" onClick={() => onFilesChange([])}>
              {language === 'kaz' ? 'Тізімді тазарту' : 'Очистить список'}
            </button>
          </div>

          <ul className="space-y-1 text-sm text-slate-600">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.name}</span>
                <div className="shrink-0 space-x-2">
                  <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                    onClick={() => onFilesChange(files.filter((candidate) => candidate !== file))}
                  >
                    {language === 'kaz' ? 'Жою' : 'Удалить'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-slate-500">{language === 'kaz' ? `Жалпы өлшемі: ${formatBytes(totalSize)}` : `Общий размер: ${formatBytes(totalSize)}`}</p>
        </div>
      )}
    </div>
  );
}
