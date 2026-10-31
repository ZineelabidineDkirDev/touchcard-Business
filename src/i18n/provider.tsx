"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "fr" | "en" | "ar";

const messages = {
  fr: {
    language:"Langue", french:"Français", english:"English", arabic:"العربية",
    workspace:"Espace professionnel", logout:"Se déconnecter", overview:"Vue d’ensemble",
    cards:"Cartes digitales", yourProfiles:"Vos profils professionnels", newLeads:"Vos nouveaux prospects", contacts:"Contacts & prospects", team:"Équipe",
    analytics:"Statistiques", loyalty:"Fidélité", settings:"Paramètres",
    login:"Se connecter", register:"Créer un compte", fullName:"Nom complet",
    email:"Adresse e-mail", password:"Mot de passe", wait:"Patientez...",
    welcome:"Bon retour.", loginIntro:"Connectez-vous pour gérer votre présence digitale.",
    start:"Démarrer", createSpace:"Créez votre espace.",
    registerIntro:"Centralisez vos cartes, vos contacts et vos interactions.",
    createAccount:"Créer mon compte", noAccount:"Vous n’avez pas encore de compte ?",
    hasAccount:"Vous avez déjà un compte ?", yourName:"Votre nom",
    minPassword:"8 caractères minimum", emailPlaceholder:"vous@entreprise.com",
    created:"Compte créé. Vérifiez votre e-mail si une confirmation est demandée.",
    dashboardLabel:"ESPACE DE GESTION", hello:"Bonjour", dashboardIntro:"Voici le point de départ de votre activité TouchCard.",
    createCard:"+ Créer une carte", profileViews:"Vues de profil", last30:"Sur les 30 derniers jours",
    collected:"Contacts collectés", interactions:"Interactions", clicks:"Clics et actions",
    ready:"Votre espace est prêt à être configuré",
    readyIntro:"Créez votre première carte digitale, ajoutez vos coordonnées et préparez votre QR code ou votre lien NFC.",
    setupCard:"Configurer ma carte", setupCompany:"Configurer mon entreprise",
    identity:"Une identité. Tous vos points de contact.",
    identityIntro:"Cartes NFC, QR codes, contacts et fidélité réunis dans un seul espace.",
    call:"Appeler", website:"Site web", powered:"Carte digitale propulsée par TouchCard",
    modulePreparing:"Module en préparation",
    secCardsTitle:"Cartes digitales",
    secCardsDesc:"Créez vos profils professionnels, personnalisez leur design et préparez vos liens NFC et QR.",
    secCardsStatus:"La gestion des cartes sera connectée à la base de données lors de la prochaine étape.",
    secContactsTitle:"Contacts & prospects",
    secContactsDesc:"Centralisez les contacts, qualifiez les prospects et suivez vos opportunités.",
    secContactsStatus:"Le CRM et la capture de prospects seront activés après la mise en place du schéma sécurisé.",
    secTeamTitle:"Équipe & collaborateurs",
    secTeamDesc:"Organisez votre entreprise, vos équipes et les accès de vos collaborateurs.",
    secTeamStatus:"La gestion multi-utilisateur dépend de la configuration des organisations et des rôles.",
    secAnalyticsTitle:"Statistiques",
    secAnalyticsDesc:"Analysez les vues, scans NFC/QR, clics et conversions de vos cartes.",
    secAnalyticsStatus:"Les indicateurs seront alimentés dès que le suivi des événements sera activé.",
    secLoyaltyTitle:"Fidélité & récompenses",
    secLoyaltyDesc:"Créez des programmes de points, récompenses et campagnes clients.",
    secLoyaltyStatus:"Le portefeuille fidélité sera connecté au registre de points sécurisé.",
    secSettingsTitle:"Paramètres",
    secSettingsDesc:"Gérez votre profil, votre entreprise et vos préférences.",
    secSettingsStatus:"Les paramètres d'organisation seront disponibles après la création de votre entreprise.",
    workspaceBrand:"ESPACE TOUCHCARD",
  },
  en: {
    language:"Language", french:"Français", english:"English", arabic:"العربية",
    workspace:"Business workspace", logout:"Log out", overview:"Overview",
    cards:"Digital cards", yourProfiles:"Your professional profiles", newLeads:"Your new leads", contacts:"Contacts & leads", team:"Team",
    analytics:"Analytics", loyalty:"Loyalty", settings:"Settings",
    login:"Log in", register:"Create an account", fullName:"Full name",
    email:"Email address", password:"Password", wait:"Please wait...",
    welcome:"Welcome back.", loginIntro:"Log in to manage your digital presence.",
    start:"Get started", createSpace:"Create your workspace.",
    registerIntro:"Bring your cards, contacts and interactions together.",
    createAccount:"Create my account", noAccount:"Don't have an account yet?",
    hasAccount:"Already have an account?", yourName:"Your name",
    minPassword:"At least 8 characters", emailPlaceholder:"you@company.com",
    created:"Account created. Check your email if confirmation is required.",
    dashboardLabel:"WORKSPACE", hello:"Hello", dashboardIntro:"Here's your TouchCard activity at a glance.",
    createCard:"+ Create a card", profileViews:"Profile views", last30:"In the last 30 days",
    collected:"Contacts collected", interactions:"Interactions", clicks:"Clicks and actions",
    ready:"Your workspace is ready to set up",
    readyIntro:"Create your first digital card, add your details and prepare your QR code or NFC link.",
    setupCard:"Set up my card", setupCompany:"Set up my company",
    identity:"One identity. Every touchpoint.",
    identityIntro:"NFC cards, QR codes, contacts and loyalty in one workspace.",
    call:"Call", website:"Website", powered:"Digital card powered by TouchCard",
    modulePreparing:"Module coming soon",
    secCardsTitle:"Digital cards",
    secCardsDesc:"Create professional profiles, customize their design and prepare your NFC and QR links.",
    secCardsStatus:"Card management will be connected to the database in the next phase.",
    secContactsTitle:"Contacts & leads",
    secContactsDesc:"Centralize contacts, qualify leads and track your opportunities.",
    secContactsStatus:"CRM and lead capture will be enabled once the secure schema is in place.",
    secTeamTitle:"Team & collaborators",
    secTeamDesc:"Organize your company, teams and collaborator access.",
    secTeamStatus:"Multi-user management depends on organization and role configuration.",
    secAnalyticsTitle:"Analytics",
    secAnalyticsDesc:"Analyze profile views, NFC/QR scans, clicks and card conversions.",
    secAnalyticsStatus:"Metrics will be populated once event tracking is enabled.",
    secLoyaltyTitle:"Loyalty & rewards",
    secLoyaltyDesc:"Create points programs, rewards and customer campaigns.",
    secLoyaltyStatus:"The loyalty wallet will be connected to the secure points ledger.",
    secSettingsTitle:"Settings",
    secSettingsDesc:"Manage your profile, company and preferences.",
    secSettingsStatus:"Organization settings will be available after your company is created.",
    workspaceBrand:"TOUCHCARD WORKSPACE",
  },
  ar: {
    language:"اللغة", french:"Français", english:"English", arabic:"العربية",
    workspace:"مساحة العمل", logout:"تسجيل الخروج", overview:"نظرة عامة",
    cards:"البطاقات الرقمية", yourProfiles:"ملفاتك المهنية", newLeads:"عملاؤك المحتملون الجدد", contacts:"جهات الاتصال والعملاء المحتملون", team:"الفريق",
    analytics:"الإحصائيات", loyalty:"الولاء والمكافآت", settings:"الإعدادات",
    login:"تسجيل الدخول", register:"إنشاء حساب", fullName:"الاسم الكامل",
    email:"البريد الإلكتروني", password:"كلمة المرور", wait:"يرجى الانتظار...",
    welcome:"مرحباً بعودتك.", loginIntro:"سجّل الدخول لإدارة حضورك الرقمي.",
    start:"ابدأ الآن", createSpace:"أنشئ مساحة العمل الخاصة بك.",
    registerIntro:"اجمع بطاقاتك وجهات اتصالك وتفاعلاتك في مكان واحد.",
    createAccount:"إنشاء حسابي", noAccount:"ليس لديك حساب بعد؟",
    hasAccount:"لديك حساب بالفعل؟", yourName:"اسمك",
    minPassword:"ثمانية أحرف على الأقل", emailPlaceholder:"you@company.com",
    created:"تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طُلب التأكيد.",
    dashboardLabel:"مساحة الإدارة", hello:"مرحباً", dashboardIntro:"إليك نظرة سريعة على نشاطك في TouchCard.",
    createCard:"+ إنشاء بطاقة", profileViews:"مشاهدات الملف", last30:"خلال آخر 30 يوماً",
    collected:"جهات الاتصال", interactions:"التفاعلات", clicks:"النقرات والإجراءات",
    ready:"مساحة العمل جاهزة للإعداد",
    readyIntro:"أنشئ بطاقتك الرقمية الأولى وأضف بياناتك وجهّز رمز QR أو رابط NFC.",
    setupCard:"إعداد بطاقتي", setupCompany:"إعداد شركتي",
    identity:"هوية واحدة. جميع نقاط التواصل.",
    identityIntro:"بطاقات NFC ورموز QR وجهات الاتصال وبرامج الولاء في مساحة واحدة.",
    call:"اتصال", website:"الموقع الإلكتروني", powered:"بطاقة رقمية مقدمة من TouchCard",
    modulePreparing:"القسم قيد الإعداد",
    secCardsTitle:"البطاقات الرقمية",
    secCardsDesc:"أنشئ ملفاتك المهنية وخصّص تصميمها وجهّز روابط NFC ورموز QR.",
    secCardsStatus:"سيتم ربط إدارة البطاقات بقاعدة البيانات في المرحلة القادمة.",
    secContactsTitle:"جهات الاتصال والعملاء المحتملون",
    secContactsDesc:"اجمع جهات الاتصال وصنّف العملاء المحتملين وتابع فرصك التجارية.",
    secContactsStatus:"سيتم تفعيل إدارة العملاء والتقاط بياناتهم بعد إعداد البنية الآمنة.",
    secTeamTitle:"الفريق والمتعاونون",
    secTeamDesc:"نظّم شركتك وفرقك وصلاحيات وصول المتعاونين.",
    secTeamStatus:"تعتمد إدارة المستخدمين المتعددين على إعداد المؤسسات والأدوار.",
    secAnalyticsTitle:"الإحصائيات",
    secAnalyticsDesc:"حلّل مشاهدات الملفات وعمليات مسح NFC وQR والنقرات والتحويلات.",
    secAnalyticsStatus:"ستظهر المؤشرات بعد تفعيل تتبع الأحداث.",
    secLoyaltyTitle:"الولاء والمكافآت",
    secLoyaltyDesc:"أنشئ برامج النقاط والمكافآت والحملات الموجهة للعملاء.",
    secLoyaltyStatus:"ستُربط محفظة الولاء بسجل النقاط الآمن.",
    secSettingsTitle:"الإعدادات",
    secSettingsDesc:"أدر ملفك الشخصي وشركتك وتفضيلاتك.",
    secSettingsStatus:"ستتوفر إعدادات المؤسسة بعد إنشاء شركتك.",
    workspaceBrand:"مساحة TOUCHCARD",
  },
} as const;

type MessageKey = keyof typeof messages.fr;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  useEffect(() => {
    const saved = window.localStorage.getItem("touchcard-locale");
    if (saved === "fr" || saved === "en" || saved === "ar") setLocaleState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    window.localStorage.setItem("touchcard-locale", locale);
  }, [locale]);
  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key) => messages[locale][key] ?? messages.fr[key],
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function I18nText({ message }: { message: MessageKey }) {
  const { t } = useI18n();
  return <>{t(message)}</>;
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span aria-hidden="true">{locale === "ar" ? "🇲🇦" : "🌐"}</span>
      <span className="sr-only">{t("language")}</span>
      <select aria-label={t("language")} value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="max-w-[112px] bg-transparent font-semibold text-slate-700 outline-none">
        <option value="fr">🇫🇷 {t("french")}</option>
        <option value="en">🇬🇧 {t("english")}</option>
        <option value="ar">🇲🇦 {t("arabic")}</option>
      </select>
    </label>
  );
}
