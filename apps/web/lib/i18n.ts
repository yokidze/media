import type { ContentSection, MaterialType } from './types';

export type AppLanguage = 'rus' | 'kaz';

export const DEFAULT_LANGUAGE: AppLanguage = 'rus';
export const LANGUAGE_STORAGE_KEY = 'polytech-media-archive-language';

export const LANGUAGE_UI_LABELS: Record<AppLanguage, string> = {
  rus: 'РУС',
  kaz: 'ҚАЗ'
};

export const HTML_LANG_BY_APP_LANGUAGE: Record<AppLanguage, string> = {
  rus: 'ru',
  kaz: 'kk'
};

export interface UiDictionary {
  appTitle: string;
  headerProfile: string;
  headerLogin: string;
  themeLight: string;
  themeDark: string;
  searchPlaceholderHero: string;
  searchPlaceholderCatalog: string;
  searchAction: string;
  homeDescription: string;
  homeQuickLinks: string;
  homeGoToCatalog: string;
  homeSeeAllMaterials: string;
  homeNewPublications: string;
  homeLatestMaterials: string;
  homeSeeAll: string;
  homeNoMaterials: string;
  catalogBackHome: string;
  catalogBreadcrumbHome: string;
  catalogBreadcrumbs: string;
  catalogBreadcrumbCatalog: string;
  catalogTitle: string;
  catalogAllSections: string;
  catalogFound: string;
  catalogAllMaterials: string;
  catalogNoResults: string;
  paginationPrev: string;
  paginationPage: string;
  paginationOf: string;
  paginationNext: string;
  filtersTitle: string;
  filtersReset: string;
  filtersYear: string;
  filtersAllYears: string;
  filtersCategories: string;
  filtersMaterialType: string;
  filtersAuthors: string;
  filtersTags: string;
  filtersAccessLevel: string;
  filtersLanguage: string;
  filtersAny: string;
  cardType: string;
  cardDate: string;
  cardCategory: string;
  cardViews: string;
  cardNoCategory: string;
  cardAuthorUnknown: string;
  cardDownload: string;
  cardNoFile: string;
  autocompleteSearching: string;
  autocompleteEmpty: string;
  autocompleteAria: string;
  footerDescription: string;
  footerContacts: string;
  footerArchiveDepartment: string;
  footerPhone: string;
  footerSchedule: string;
  footerWeekdays: string;
  footerWeekend: string;
  accountBackHome: string;
  accountBreadcrumbs: string;
  accountBreadcrumbProfile: string;
  accountTitle: string;
  accountSectionMain: string;
  accountSectionMaterials: string;
  accountSectionSettings: string;
  accountJobTitle: string;
  accountDepartment: string;
  accountEmail: string;
  accountPhone: string;
  accountPhoto: string;
  accountNotSpecified: string;
  accountPhoneOptional: string;
  accountNoMaterials: string;
  accountEditProfile: string;
  accountLogout: string;
  accountCancelEdit: string;
  accountSaveProfile: string;
  accountEditHint: string;
  accountProfileUpdated: string;
  accountSaveFailed: string;
  accountLoginAction: string;
  accountLoadFailed: string;
  accountLoading: string;
  accountCreatedAt: string;
  accountSettingsHelp: string;
  accountOpenMaterial: string;
  accountAvatarHint: string;
  accountAvatarUpload: string;
  accountAvatarChange: string;
  accountAvatarRemove: string;
  accountAvatarUploading: string;
  accountAvatarRemoving: string;
  accountAvatarInvalidType: string;
  accountAvatarTooLarge: string;
  accountAvatarUploadFailed: string;
  accountAvatarDeleteFailed: string;
  addMaterialButton: string;
  cardManageOpenMenu: string;
  cardManageEdit: string;
  cardManageDelete: string;
  cardManageDeleting: string;
  cardManageEditTitle: string;
  cardManageTitle: string;
  cardManageDescription: string;
  cardManageDate: string;
  cardManageCategory: string;
  cardManageNoCategory: string;
  cardManageMaterialType: string;
  cardManageCancel: string;
  cardManageSave: string;
  cardManageSaving: string;
  cardManageValidationTitle: string;
  cardManageValidationDescription: string;
  cardManageDeleteTitle: string;
  cardManageDeleteConfirm: string;
  cardManageSaveFailed: string;
  cardManageDeleteFailed: string;
}

export type UiTranslationKey = keyof UiDictionary;

export const UI_DICTIONARIES: Record<AppLanguage, UiDictionary> = {
  rus: {
    appTitle: 'Polytech медиа архив',
    headerProfile: 'Профиль',
    headerLogin: 'Войти',
    themeLight: 'Светлая тема',
    themeDark: 'Тёмная тема',
    searchPlaceholderHero: 'Поиск по архиву',
    searchPlaceholderCatalog: 'Поиск по названию, автору, тегам, ключевым словам',
    searchAction: 'Искать',
    homeDescription: 'Архив статей, телесюжетов и мероприятий колледжа',
    homeQuickLinks: 'Быстрые переходы',
    homeGoToCatalog: 'Перейти в каталог',
    homeSeeAllMaterials: 'Смотреть все материалы',
    homeNewPublications: 'Новые публикации',
    homeLatestMaterials: 'Последние материалы',
    homeSeeAll: 'Смотреть все',
    homeNoMaterials: 'Пока нет опубликованных материалов.',
    catalogBackHome: '← На главную',
    catalogBreadcrumbHome: 'Главная',
    catalogBreadcrumbs: 'Хлебные крошки',
    catalogBreadcrumbCatalog: 'Каталог',
    catalogTitle: 'Каталог материалов',
    catalogAllSections: 'Все разделы',
    catalogFound: 'найдено',
    catalogAllMaterials: 'Все материалы',
    catalogNoResults: 'По выбранным условиям ничего не найдено.',
    paginationPrev: 'Назад',
    paginationPage: 'Страница',
    paginationOf: 'из',
    paginationNext: 'Далее',
    filtersTitle: 'Фильтры',
    filtersReset: 'Сбросить',
    filtersYear: 'Год',
    filtersAllYears: 'Все годы',
    filtersCategories: 'Категории',
    filtersMaterialType: 'Тип материала',
    filtersAuthors: 'Авторы',
    filtersTags: 'Теги',
    filtersAccessLevel: 'Уровень доступа',
    filtersLanguage: 'Язык',
    filtersAny: 'Любой',
    cardType: 'Тип',
    cardDate: 'Дата',
    cardCategory: 'Категория',
    cardViews: 'Просмотры',
    cardNoCategory: 'Без категории',
    cardAuthorUnknown: 'Автор не указан',
    cardDownload: 'Скачать',
    cardNoFile: 'Файл не прикреплён',
    autocompleteSearching: 'Поиск...',
    autocompleteEmpty: 'Ничего не найдено',
    autocompleteAria: 'Подсказки поиска',
    footerDescription: 'Единый архив статей, телесюжетов и фото мероприятий колледжа.',
    footerContacts: 'Контакты',
    footerArchiveDepartment: 'Архивный отдел',
    footerPhone: 'Телефон',
    footerSchedule: 'Режим работы',
    footerWeekdays: 'Пн-Пт: 09:00-18:00',
    footerWeekend: 'Сб-Вс: выходной',
    accountBackHome: '← На главную',
    accountBreadcrumbs: 'Хлебные крошки',
    accountBreadcrumbProfile: 'Профиль',
    accountTitle: 'Личный кабинет',
    accountSectionMain: 'Основное',
    accountSectionMaterials: 'Мои материалы',
    accountSectionSettings: 'Настройки аккаунта',
    accountJobTitle: 'Должность',
    accountDepartment: 'Отделение',
    accountEmail: 'Email',
    accountPhone: 'Телефон',
    accountPhoto: 'Фото профиля',
    accountNotSpecified: 'Не указано',
    accountPhoneOptional: 'Телефон (опционально)',
    accountNoMaterials: 'У вас пока нет добавленных материалов.',
    accountEditProfile: 'Редактировать профиль',
    accountLogout: 'Выйти',
    accountCancelEdit: 'Отмена',
    accountSaveProfile: 'Сохранить',
    accountEditHint: 'Измените данные и сохраните профиль.',
    accountProfileUpdated: 'Профиль обновлён.',
    accountSaveFailed: 'Не удалось сохранить профиль',
    accountLoginAction: 'Перейти ко входу',
    accountLoadFailed: 'Не удалось загрузить профиль',
    accountLoading: 'Загрузка профиля...',
    accountCreatedAt: 'Дата регистрации',
    accountSettingsHelp: 'Вы редактируете только свои данные.',
    accountOpenMaterial: 'Открыть',
    accountAvatarHint: 'Поддерживаются JPG, JPEG, PNG и WEBP до 5 МБ.',
    accountAvatarUpload: 'Загрузить фото',
    accountAvatarChange: 'Изменить фото',
    accountAvatarRemove: 'Удалить фото',
    accountAvatarUploading: 'Загружаем фото...',
    accountAvatarRemoving: 'Удаляем фото...',
    accountAvatarInvalidType: 'Можно загрузить только JPG, JPEG, PNG или WEBP.',
    accountAvatarTooLarge: 'Размер файла не должен превышать 5 МБ.',
    accountAvatarUploadFailed: 'Не удалось загрузить фото',
    accountAvatarDeleteFailed: 'Не удалось удалить фото',
    addMaterialButton: 'Добавить материал',
    cardManageOpenMenu: 'Управление материалом',
    cardManageEdit: 'Редактировать',
    cardManageDelete: 'Удалить',
    cardManageDeleting: 'Удаление...',
    cardManageEditTitle: 'Редактирование материала',
    cardManageTitle: 'Название',
    cardManageDescription: 'Описание',
    cardManageDate: 'Дата',
    cardManageCategory: 'Категория',
    cardManageNoCategory: 'Без категории',
    cardManageMaterialType: 'Тип материала',
    cardManageCancel: 'Отмена',
    cardManageSave: 'Сохранить',
    cardManageSaving: 'Сохраняем...',
    cardManageValidationTitle: 'Введите название материала (минимум 2 символа).',
    cardManageValidationDescription: 'Описание слишком длинное.',
    cardManageDeleteTitle: 'Удаление материала',
    cardManageDeleteConfirm: 'Вы уверены, что хотите удалить этот материал?',
    cardManageSaveFailed: 'Не удалось сохранить изменения. Попробуйте снова.',
    cardManageDeleteFailed: 'Не удалось удалить материал. Попробуйте снова.'
  },
  kaz: {
    appTitle: 'Polytech медиа архив',
    headerProfile: 'Жеке кабинет',
    headerLogin: 'Кіру',
    themeLight: 'Жарық тақырып',
    themeDark: 'Қараңғы тақырып',
    searchPlaceholderHero: 'Архив бойынша іздеу',
    searchPlaceholderCatalog: 'Атауы, авторы, тегтер мен кілт сөздер бойынша іздеу',
    searchAction: 'Іздеу',
    homeDescription: 'Колледждің мақалалар, телесюжеттер және іс-шаралар архиві',
    homeQuickLinks: 'Жылдам өту',
    homeGoToCatalog: 'Мұрағатқа өту',
    homeSeeAllMaterials: 'Барлық материалдарды көру',
    homeNewPublications: 'Жаңа жарияланымдар',
    homeLatestMaterials: 'Соңғы материалдар',
    homeSeeAll: 'Барлығын көру',
    homeNoMaterials: 'Әзірге жарияланған материалдар жоқ.',
    catalogBackHome: '← Басты бетке',
    catalogBreadcrumbHome: 'Басты бет',
    catalogBreadcrumbs: 'Навигация тізбегі',
    catalogBreadcrumbCatalog: 'Мұрағат',
    catalogTitle: 'Мұрағат материалдары',
    catalogAllSections: 'Барлық бөлімдер',
    catalogFound: 'табылды',
    catalogAllMaterials: 'Барлық материалдар',
    catalogNoResults: 'Таңдалған шарттар бойынша ештеңе табылмады.',
    paginationPrev: 'Артқа',
    paginationPage: 'Бет',
    paginationOf: 'ішінен',
    paginationNext: 'Келесі',
    filtersTitle: 'Сүзгілер',
    filtersReset: 'Тазарту',
    filtersYear: 'Жыл',
    filtersAllYears: 'Барлық жылдар',
    filtersCategories: 'Санаттар',
    filtersMaterialType: 'Материал түрі',
    filtersAuthors: 'Авторлар',
    filtersTags: 'Тегтер',
    filtersAccessLevel: 'Қолжетімділік деңгейі',
    filtersLanguage: 'Тіл',
    filtersAny: 'Кез келген',
    cardType: 'Түрі',
    cardDate: 'Күні',
    cardCategory: 'Санат',
    cardViews: 'Қаралымдар',
    cardNoCategory: 'Санатсыз',
    cardAuthorUnknown: 'Автор көрсетілмеген',
    cardDownload: 'Жүктеп алу',
    cardNoFile: 'Файл тіркелмеген',
    autocompleteSearching: 'Іздеу...',
    autocompleteEmpty: 'Ештеңе табылмады',
    autocompleteAria: 'Іздеу ұсыныстары',
    footerDescription: 'Колледж мақалалары, телесюжеттері және іс-шара фотоларының бірыңғай архиві.',
    footerContacts: 'Байланыс',
    footerArchiveDepartment: 'Архив бөлімі',
    footerPhone: 'Телефон',
    footerSchedule: 'Жұмыс уақыты',
    footerWeekdays: 'Дс-Жм: 09:00-18:00',
    footerWeekend: 'Сб-Жс: демалыс',
    accountBackHome: '← Басты бетке',
    accountBreadcrumbs: 'Навигация тізбегі',
    accountBreadcrumbProfile: 'Жеке кабинет',
    accountTitle: 'Жеке кабинет',
    accountSectionMain: 'Негізгі ақпарат',
    accountSectionMaterials: 'Менің материалдарым',
    accountSectionSettings: 'Тіркелгі баптаулары',
    accountJobTitle: 'Лауазымы',
    accountDepartment: 'Бөлім',
    accountEmail: 'Email',
    accountPhone: 'Телефон',
    accountPhoto: 'Жеке сурет',
    accountNotSpecified: 'Көрсетілмеген',
    accountPhoneOptional: 'Телефон (міндетті емес)',
    accountNoMaterials: 'Сізде әзірге материалдар жоқ.',
    accountEditProfile: 'Деректерді өңдеу',
    accountLogout: 'Шығу',
    accountCancelEdit: 'Болдырмау',
    accountSaveProfile: 'Сақтау',
    accountEditHint: 'Өзгерістерді енгізіп, сақтаңыз.',
    accountProfileUpdated: 'Деректер сәтті жаңартылды.',
    accountSaveFailed: 'Деректерді сақтау мүмкін болмады',
    accountLoginAction: 'Кіру бетіне өту',
    accountLoadFailed: 'Пайдаланушы деректерін жүктеу мүмкін болмады',
    accountLoading: 'Пайдаланушы деректері жүктелуде...',
    accountCreatedAt: 'Тіркелген күні',
    accountSettingsHelp: 'Сіз тек өз деректеріңізді өңдей аласыз.',
    accountOpenMaterial: 'Ашу',
    accountAvatarHint: 'JPG, JPEG, PNG және WEBP (5 МБ дейін) қолданылады.',
    accountAvatarUpload: 'Фото жүктеу',
    accountAvatarChange: 'Суретті өзгерту',
    accountAvatarRemove: 'Суретті жою',
    accountAvatarUploading: 'Фото жүктелуде...',
    accountAvatarRemoving: 'Сурет жойылуда...',
    accountAvatarInvalidType: 'Тек JPG, JPEG, PNG немесе WEBP жүктеуге болады.',
    accountAvatarTooLarge: 'Файл өлшемі 5 МБ-тан аспауы керек.',
    accountAvatarUploadFailed: 'Суретті жүктеу мүмкін болмады',
    accountAvatarDeleteFailed: 'Суретті жою мүмкін болмады',
    addMaterialButton: 'Материал қосу',
    cardManageOpenMenu: 'Материалды басқару',
    cardManageEdit: 'Өңдеу',
    cardManageDelete: 'Жою',
    cardManageDeleting: 'Жойылуда...',
    cardManageEditTitle: 'Материалды өңдеу',
    cardManageTitle: 'Атауы',
    cardManageDescription: 'Сипаттамасы',
    cardManageDate: 'Күні',
    cardManageCategory: 'Санат',
    cardManageNoCategory: 'Санатсыз',
    cardManageMaterialType: 'Материал түрі',
    cardManageCancel: 'Болдырмау',
    cardManageSave: 'Сақтау',
    cardManageSaving: 'Сақталуда...',
    cardManageValidationTitle: 'Материал атауын енгізіңіз (кемі 2 таңба).',
    cardManageValidationDescription: 'Сипаттама тым ұзын.',
    cardManageDeleteTitle: 'Материалды жою',
    cardManageDeleteConfirm: 'Бұл материалды жойғыңыз келетініне сенімдісіз бе?',
    cardManageSaveFailed: 'Өзгерістерді сақтау мүмкін болмады. Қайтадан көріңіз.',
    cardManageDeleteFailed: 'Материалды жою мүмкін болмады. Қайтадан көріңіз.'
  }
};

export const SECTION_LABELS_BY_LANGUAGE: Record<AppLanguage, Record<ContentSection, string>> = {
  rus: {
    ARTICLE: 'Статьи',
    TV_STORY: 'Телесюжеты',
    EVENT_PHOTO: 'Фото мероприятий',
    METHODICAL_AUTHOR_PROGRAM: 'Методические рекомендации и авторские программы'
  },
  kaz: {
    ARTICLE: 'Мақалалар',
    TV_STORY: 'Телесюжеттер',
    EVENT_PHOTO: 'Іс-шара фотолары',
    METHODICAL_AUTHOR_PROGRAM: 'Әдістемелік ұсынымдар және авторлық бағдарламалар'
  }
};

export const SECTION_TYPE_LABELS_BY_LANGUAGE: Record<AppLanguage, Record<ContentSection, string>> = {
  rus: {
    ARTICLE: 'Статья',
    TV_STORY: 'Телесюжет',
    EVENT_PHOTO: 'Фото',
    METHODICAL_AUTHOR_PROGRAM: 'Методический материал'
  },
  kaz: {
    ARTICLE: 'Мақала',
    TV_STORY: 'Телесюжет',
    EVENT_PHOTO: 'Фото',
    METHODICAL_AUTHOR_PROGRAM: 'Әдістемелік материал'
  }
};

export const MATERIAL_TYPE_LABELS_BY_LANGUAGE: Record<AppLanguage, Record<MaterialType, string>> = {
  rus: {
    DOCUMENT: 'Документ',
    ARTICLE: 'Статья',
    NEWSPAPER: 'Газета',
    BOOKLET: 'Буклет',
    UMKD: 'Учебно-методический комплекс дисциплины',
    METHODICAL_RECOMMENDATION_PROGRAM: 'Методические рекомендации и авторские программы',
    IMAGE: 'Фото',
    VIDEO: 'Видео',
    AUDIO: 'Аудио',
    SCAN: 'Скан',
    OTHER: 'Другое'
  },
  kaz: {
    DOCUMENT: 'Құжат',
    ARTICLE: 'Мақала',
    NEWSPAPER: 'Газет',
    BOOKLET: 'Кітапша',
    UMKD: 'Пәннің оқу-әдістемелік кешені',
    METHODICAL_RECOMMENDATION_PROGRAM: 'Әдістемелік ұсынымдар және авторлық бағдарламалар',
    IMAGE: 'Сурет',
    VIDEO: 'Бейне',
    AUDIO: 'Аудио',
    SCAN: 'Сканер көшірмесі',
    OTHER: 'Басқа'
  }
};

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'rus' || value === 'kaz';
}
