import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Globe2,
  Headphones,
  Info,
  LockKeyhole,
  Mail,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { APP_VERSION_FALLBACK, getAppVersion } from "@/lib/appVersion";

const COMPANY = "NEOMART";
const PHONE = "+9647776845909";
const WHATSAPP = "https://wa.me/9647776845909";
const EMAIL = "neomart.space@gmail.com";
const EMAIL_URL = `mailto:${EMAIL}`;
const WEBSITE = "neomart.space";
const WEBSITE_URL = "https://neomart.space";

type PolicyBlock = {
  title?: string;
  paragraphs?: string[];
  items?: string[];
};

type Policy = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  summary: string;
  blocks: PolicyBlock[];
};

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "السياسات والشروط — NEOMART" },
      {
        name: "description",
        content: "سياسات الخصوصية والطلبات والشحن والضمان والدفع وشروط استخدام NEOMART.",
      },
    ],
  }),
  component: PoliciesPage,
});

const POLICIES: Policy[] = [
  {
    id: "privacy",
    number: "01",
    title: "سياسة الخصوصية",
    icon: LockKeyhole,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "كيف نتعامل مع معلوماتك ونحمي خصوصيتك أثناء استخدام NEOMART.",
    blocks: [
      {
        title: "مقدمة",
        paragraphs: [
          "نحن في NEOMART نحترم خصوصية المستخدمين ونلتزم بحماية المعلومات الشخصية التي يتم التعامل معها من خلال التطبيق.",
          "تهدف هذه السياسة إلى توضيح نوع المعلومات التي قد يتم جمعها أو إدخالها أو تخزينها، والغرض من استخدامها، وكيفية حمايتها، والجهات التي قد تتعامل معها، وحقوق المستخدم المتعلقة ببياناته.",
          "تطبق هذه السياسة على تطبيق NEOMART والخدمات المرتبطة به.",
        ],
      },
      {
        title: "المعلومات التي قد يتم جمعها",
        items: [
          "الاسم ورقم الهاتف.",
          "بيانات التوصيل وتفاصيل الطلب.",
          "المنتجات أو الخدمات المطلوبة.",
          "الملاحظات المرتبطة بالطلب أو التوصيل.",
          "معلومات تقنية مثل نوع الجهاز ونظام التشغيل وإصدار التطبيق ومعلومات الاتصال أو الأخطاء، بحسب الخدمات والمكتبات المستخدمة فعليًا.",
        ],
      },
      {
        title: "لماذا نستخدم هذه المعلومات؟",
        items: [
          "إنشاء ومعالجة الطلبات والتواصل مع العميل بخصوصها.",
          "تجهيز وتسليم الطلب وتأكيد بيانات التوصيل ومتابعة الحالة.",
          "معالجة طلبات الاستبدال أو الاسترداد أو الضمان.",
          "تقديم خدمة العملاء والدعم وحماية التطبيق من الاستخدام غير المصرح به.",
          "معالجة الأخطاء والمشكلات التقنية وتحسين أداء وتجربة استخدام التطبيق.",
        ],
        paragraphs: [
          "لا نستخدم البيانات لأغراض لا تتوافق مع الغرض الذي تم جمعها من أجله إلا عندما يكون ذلك مسموحًا به قانونيًا أو بعد الحصول على الموافقات المطلوبة عند الحاجة.",
        ],
      },
      {
        title: "إشعارات الطلبات عبر Telegram",
        paragraphs: [
          "يستخدم NEOMART خدمة Telegram من خلال بوت مخصص لإرسال إشعارات الطلبات الجديدة إلى فريق NEOMART أو الأشخاص المخولين بمعالجة الطلبات.",
          "قد تتضمن إشعارات الطلبات معلومات ضرورية لتنفيذ الطلب، مثل:",
        ],
        items: [
          "اسم العميل.",
          "رقم الهاتف.",
          "عنوان التوصيل.",
          "ملاحظات الطلب.",
          "المنتجات المطلوبة.",
          "قيمة الطلب.",
          "طريقة الدفع.",
          "رمز الطلب.",
        ],
      },
      {
        title: "استخدام بيانات إشعارات Telegram وحمايتها",
        paragraphs: [
          "تُستخدم هذه المعلومات عبر Telegram لغرض إشعار الفريق المختص بالطلبات ومعالجتها وتنفيذ عمليات التوصيل وخدمة العملاء، ولا يتم نشر هذه المعلومات للعامة أو استخدامها لأغراض تسويقية.",
          "يتم تقييد الوصول إلى بوت وقنوات إشعارات NEOMART على الأشخاص المخولين، ونتخذ إجراءات مناسبة لحماية بيانات الطلبات من الوصول غير المصرح به.",
        ],
      },
      {
        title: "تخزين البيانات ومشاركتها",
        paragraphs: [
          "قد يتم تخزين بيانات الطلبات والبيانات المرتبطة بها على أنظمة وخوادم تقنية تستخدم لتشغيل NEOMART، بما في ذلك خدمات قواعد البيانات والاستضافة التي يعتمد عليها التطبيق.",
          "لا نقوم ببيع البيانات الشخصية للعملاء. وقد تتم مشاركة أو إتاحة المعلومات بالقدر الضروري لتقديم الخدمة لموظفي NEOMART المخولين، ومزودي الاستضافة وقواعد البيانات، وخدمات التوصيل، أو الجهات الحكومية والقانونية عندما يكون الإفصاح مطلوبًا بموجب القانون.",
        ],
      },
      {
        title: "حماية البيانات والاحتفاظ بها",
        paragraphs: [
          "نستخدم وسائل تقنية وإدارية مناسبة للمساعدة في حماية البيانات، مثل التحكم في الصلاحيات، حماية الاتصالات، تقييد الوصول إلى البيانات، وإجراءات الحماية الخاصة بالخوادم وقواعد البيانات.",
          "لا توجد وسيلة إلكترونية يمكن ضمان أنها آمنة بنسبة 100%، ولذلك لا يمكن ضمان الحماية المطلقة من جميع المخاطر الإلكترونية.",
          "نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمات وإدارة الطلبات وخدمة العملاء والاسترداد والاستبدال والضمان والالتزامات القانونية أو المحاسبية عند وجودها. عند انتهاء الحاجة، يتم حذفها أو إتلافها أو جعلها غير قابلة للتحديد وفق الإجراءات المتاحة.",
        ],
      },
      {
        title: "حذف البيانات وحقوق المستخدم",
        paragraphs: [
          "يمكن للمستخدم طلب حذف بياناته الشخصية أو الاستفسار عن البيانات المرتبطة به عبر البريد الإلكتروني. تتم مراجعة طلب الحذف واتخاذ الإجراء المناسب وفقًا للبيانات المحتفظ بها والالتزامات القانونية أو التشغيلية التي قد تتطلب الاحتفاظ ببعض السجلات.",
          "لا يهدف NEOMART إلى جمع بيانات الأطفال أو استهدافهم بشكل مستقل. وإذا تم اكتشاف تقديم بيانات طفل دون أساس مناسب أو موافقة مطلوبة، يمكن التواصل معنا لاتخاذ الإجراء المناسب.",
        ],
      },
      {
        title: "الخدمات والمكتبات الخارجية والتغييرات",
        paragraphs: [
          "قد يستخدم التطبيق خدمات أو مكتبات أو أدوات خارجية ضرورية لتشغيل بعض وظائفه، وقد تقوم هذه الخدمات بمعالجة بيانات تقنية أو بيانات أخرى وفق طريقة تكاملها وسياساتها الخاصة. نراجع الخدمات الخارجية المستخدمة ونسعى إلى استخدامها بما يتوافق مع متطلبات الخصوصية والأمان وسياسات Google Play.",
          "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر نتيجة لتغييرات في التطبيق أو الخدمات أو المتطلبات القانونية. سيتم تحديث تاريخ آخر مراجعة في أعلى الصفحة، وقد يتم تقديم إشعار إضافي داخل التطبيق عند الحاجة.",
        ],
      },
    ],
  },
  {
    id: "returns",
    number: "02",
    title: "سياسة الاسترداد والاستبدال",
    icon: RotateCcw,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "الشروط والإجراءات الخاصة بإرجاع المنتجات أو استبدالها.",
    blocks: [
      {
        title: "الاستبدال أو الإرجاع",
        paragraphs: ["يمكن للعميل طلب إرجاع أو استبدال المنتج خلال 5 أيام من تاريخ الاستلام، بشرط:"],
        items: [
          "أن يكون المنتج في حالته الأصلية.",
          "ألا يكون قد تم استخدامه أو إتلافه بسبب سوء الاستخدام.",
          "أن تكون ملحقاته وتغليفه، عند وجودها، بحالة مناسبة.",
          "تقديم ما يثبت عملية الشراء عند الحاجة.",
        ],
      },
      {
        title: "المنتج المختلف أو المعيب",
        paragraphs: [
          "إذا تم استلام منتج مختلف عن المنتج المطلوب أو كان المنتج يحتوي على عيب تصنيع أو عيب واضح عند الاستلام، يتم التواصل مع NEOMART لمعالجة الحالة.",
          "عندما يكون الخطأ من جانب NEOMART أو يكون المنتج معيبًا وفق شروط الضمان، تتحمل NEOMART تكاليف الاستبدال أو الاسترجاع والتوصيل وفقًا للحالة.",
        ],
      },
      {
        title: "الأضرار الناتجة عن سوء الاستخدام",
        paragraphs: ["لا يشمل الاسترداد أو الاستبدال الأضرار الناتجة عن:"],
        items: [
          "سوء الاستخدام أو الاستخدام المخالف لطريقة الاستخدام.",
          "الكسر أو التلف الناتج عن العميل.",
          "التخزين غير الصحيح.",
          "التعديلات أو الإصلاحات غير المعتمدة.",
        ],
      },
      {
        title: "آلية الطلب ومدة المعالجة",
        paragraphs: [
          "يمكن للعميل التواصل مع خدمة العملاء عبر واتساب وإرفاق صور أو فيديو واضح للمنتج عند وجود عيب أو اختلاف في الطلب لتسهيل تقييم الحالة.",
          "تتم مراجعة طلب الاسترداد أو الاستبدال بعد استلام التفاصيل المطلوبة، ويتم إبلاغ العميل بالإجراء المناسب والمدة المتوقعة حسب الحالة.",
        ],
      },
    ],
  },
  {
    id: "shipping",
    number: "03",
    title: "سياسة الشحن والتوصيل",
    icon: Truck,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "مواعيد التوصيل ومسؤوليات العميل وخيارات الدفع عند الاستلام.",
    blocks: [
      {
        title: "مدة التوصيل المتوقعة",
        items: [
          "بغداد: 1–3 أيام.",
          "باقي المحافظات: 2–4 أيام.",
        ],
        paragraphs: [
          "قد تختلف مدة التوصيل بسبب الظروف التشغيلية أو الأحوال الجوية أو العطل الرسمية أو عوامل خارجة عن سيطرة NEOMART.",
        ],
      },
      {
        title: "متابعة الطلب",
        paragraphs: [
          "عند توفر رقم تتبع للطلب، يتم تزويد العميل به بعد تجهيز الطلب حتى يتمكن من متابعة حالة الشحنة.",
        ],
      },
      {
        title: "بيانات التوصيل",
        paragraphs: ["يتحمل العميل مسؤولية تقديم معلومات توصيل صحيحة وكاملة، بما في ذلك:"],
        items: [
          "الاسم ورقم الهاتف.",
          "المحافظة والمنطقة.",
        ],
      },
      {
        title: "عدم استلام الطلب",
        paragraphs: [
          "إذا تعذر تسليم الطلب بسبب عدم الرد على الهاتف أو عدم توفر العميل أو تقديم عنوان غير صحيح، فقد تتم إعادة جدولة التوصيل أو إلغاء الطلب وفقًا للحالة.",
        ],
      },
      {
        title: "الدفع عند الاستلام",
        paragraphs: [
          "يتوفر الدفع عند الاستلام للطلبات التي تدعم هذه الطريقة، ويجب على العميل دفع قيمة الطلب عند استلامه وفقًا للمبلغ المؤكد في الطلب.",
        ],
      },
    ],
  },
  {
    id: "warranty",
    number: "04",
    title: "سياسة الضمان",
    icon: ShieldCheck,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "تغطية عيوب التصنيع وآلية الإبلاغ عنها والنتائج الممكنة.",
    blocks: [
      {
        title: "مدة الضمان والحالات المشمولة",
        paragraphs: [
          "تتمتع المنتجات المشمولة بالضمان بضمان لمدة 6 أشهر ضد عيوب التصنيع، ويبدأ احتساب المدة من تاريخ التسليم.",
          "يشمل الضمان عيوب التصنيع التي تظهر أثناء الاستخدام الطبيعي للمنتج وضمن مدة الضمان.",
        ],
      },
      {
        title: "الحالات غير المشمولة",
        paragraphs: ["لا يشمل الضمان الأضرار الناتجة عن:"],
        items: [
          "سوء الاستخدام أو الكسر أو الصدمات.",
          "السوائل أو الرطوبة إذا لم يكن المنتج مصممًا لتحملها.",
          "الاستخدام المخالف لتعليمات المنتج.",
          "الإصلاح أو التعديل من جهة غير معتمدة.",
          "الإهمال أو التخزين غير المناسب.",
        ],
      },
      {
        title: "الإبلاغ عن المشكلة",
        paragraphs: [
          "يرجى التواصل مع NEOMART خلال 28 ساعة من اكتشاف المشكلة أو استلام المنتج، بحسب طبيعة الحالة، وإرفاق صورة أو فيديو واضح عند طلب ذلك. تتم مراجعة الحالة وتحديد ما إذا كانت مشمولة بالضمان.",
        ],
      },
      {
        title: "نتيجة الضمان",
        paragraphs: ["عند ثبوت وجود عيب تصنيع مشمول بالضمان، قد يتم:"],
        items: [
          "استبدال المنتج.",
          "إصلاح المنتج إذا كان ذلك ممكنًا.",
          "استرداد قيمة المنتج بحسب طبيعة الحالة وتوفر المنتج.",
        ],
      },
    ],
  },
  {
    id: "payment",
    number: "05",
    title: "سياسة الدفع",
    icon: CreditCard,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "طرق الدفع وقيمة الطلب وما يجب معرفته قبل التأكيد.",
    blocks: [
      {
        title: "طرق الدفع المتاحة",
        paragraphs: [
          "يوفر NEOMART طرق الدفع المتاحة داخل التطبيق أو أثناء إتمام الطلب. طريقة الدفع الحالية هي الدفع عند الاستلام، ما لم يتم توفير طرق دفع أخرى داخل التطبيق.",
        ],
      },
      {
        title: "قيمة الطلب",
        paragraphs: [
          "يتم عرض قيمة المنتجات والخدمات وتكاليف التوصيل، عند وجودها، قبل تأكيد الطلب قدر الإمكان.",
        ],
      },
      {
        title: "الدفع عند الاستلام",
        paragraphs: [
          "في حالة اختيار الدفع عند الاستلام، يتم دفع المبلغ المستحق عند وصول الطلب وفق القيمة المؤكدة في الطلب.",
        ],
      },
      {
        title: "المدفوعات الإلكترونية",
        paragraphs: [
          "إذا تمت إضافة أي وسيلة دفع إلكترونية مستقبلًا، فسيتم توضيح شروطها وطريقة معالجتها للمستخدم قبل إتمام عملية الدفع.",
        ],
      },
    ],
  },
  {
    id: "terms",
    number: "06",
    title: "شروط وأحكام الاستخدام",
    icon: FileCheck2,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "القواعد العامة لاستخدام التطبيق وإنشاء الطلبات والاستفادة من خدمات NEOMART.",
    blocks: [
      {
        title: "استخدام التطبيق والطلبات",
        paragraphs: [
          "يجب استخدام NEOMART لأغراض مشروعة وبما يتوافق مع القوانين والسياسات المعمول بها.",
          "عند إنشاء طلب، يلتزم المستخدم بتقديم معلومات صحيحة وكاملة تساعد على تنفيذ الطلب والتوصيل.",
        ],
      },
      {
        title: "الأسعار والمنتجات والتوفر",
        paragraphs: [
          "نسعى إلى عرض معلومات دقيقة عن المنتجات والأسعار والتوفر، ولكن قد تحدث أخطاء غير مقصودة في المعلومات أو الأسعار أو المخزون. في حال وجود خطأ جوهري، قد يتم التواصل مع العميل لتأكيد الطلب أو تعديله أو إلغائه.",
          "قد تكون بعض المنتجات غير متوفرة أو قد ينفد مخزونها بعد إنشاء الطلب. في هذه الحالة، قد يتم التواصل مع العميل لتقديم بديل مناسب أو تعديل الطلب أو إلغائه بحسب الحالة.",
        ],
      },
      {
        title: "إساءة استخدام التطبيق",
        paragraphs: ["يُمنع استخدام التطبيق في:"],
        items: [
          "محاولة الوصول غير المصرح به إلى الأنظمة.",
          "استغلال الثغرات أو محاولة تعطيل الخدمة.",
          "إدخال بيانات احتيالية.",
          "استخدام التطبيق بطريقة تضر بالمستخدمين أو NEOMART.",
          "تنفيذ عمليات آلية أو محاولات وصول غير مصرح بها إلى الأنظمة أو قواعد البيانات.",
        ],
      },
      {
        title: "إيقاف الطلبات والملكية الفكرية",
        paragraphs: [
          "يحق لـNEOMART رفض أو إلغاء أي طلب عند وجود سبب مشروع، مثل الاشتباه في الاحتيال، أو وجود خطأ جوهري في السعر أو المنتج، أو تعذر توفير المنتج، أو وجود مشكلة في معلومات التوصيل.",
          "جميع عناصر NEOMART، بما في ذلك الاسم والشعار والتصاميم والنصوص والصور والواجهات والمحتوى، مملوكة لـNEOMART أو مستخدمة بموجب حقوق أو تراخيص مناسبة، ولا يجوز نسخها أو إعادة استخدامها تجاريًا دون إذن.",
        ],
      },
    ],
  },
  {
    id: "security",
    number: "07",
    title: "سياسة أمن المعلومات",
    icon: ShieldCheck,
    accent: "from-slate-500/20 to-zinc-500/5",
    summary: "الإجراءات التي نستخدمها للمساعدة في حماية الأنظمة وبيانات المستخدمين.",
    blocks: [
      {
        title: "إجراءات الحماية",
        paragraphs: [
          "نسعى إلى حماية أنظمة NEOMART وبيانات المستخدمين من الوصول غير المصرح به من خلال مجموعة من الإجراءات التقنية والتنظيمية.",
        ],
        items: [
          "التحكم في صلاحيات الوصول.",
          "حماية مفاتيح وأسرار النظام.",
          "تأمين الاتصالات بين التطبيق والخدمات الخلفية.",
          "حماية قواعد البيانات ومراقبة العمليات الحساسة.",
          "تسجيل الأحداث الأمنية عند الحاجة وتحديث الأنظمة والمكونات البرمجية.",
          "اتخاذ إجراءات طارئة عند اكتشاف نشاط مشبوه.",
        ],
      },
      {
        title: "الحوادث الأمنية",
        paragraphs: [
          "في حال اكتشاف حادث أمني يؤثر بشكل جوهري على البيانات، سيتم التعامل معه وفقًا للإجراءات الأمنية والقانونية المعمول بها.",
        ],
      },
    ],
  },
  {
    id: "support",
    number: "08",
    title: "سياسة التواصل وخدمة العملاء",
    icon: Headphones,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "قنوات التواصل المتاحة للاستفسار عن الطلبات والمنتجات والبيانات.",
    blocks: [
      {
        title: "مجالات الدعم",
        paragraphs: ["يمكن للعملاء التواصل مع NEOMART للاستفسار عن:"],
        items: [
          "الطلبات والتوصيل.",
          "المنتجات.",
          "الاستبدال والاسترداد.",
          "الضمان.",
          "الخصوصية والبيانات.",
        ],
      },
      {
        title: "بيانات التواصل",
        paragraphs: [
          "رقم التواصل وأوقات خدمة العملاء موضحة في بطاقة التواصل أسفل كل سياسة. يمكن أيضًا مراسلتنا عبر البريد الإلكتروني الرسمي.",
        ],
      },
    ],
  },
  {
    id: "updates",
    number: "09",
    title: "تحديث السياسات",
    icon: Info,
    accent: "from-muted-foreground/20 to-muted/40",
    summary: "كيف نتعامل مع تحديثات السياسات عند تطوير التطبيق أو الخدمات.",
    blocks: [
      {
        title: "التحديث والإشعار",
        paragraphs: [
          "قد يتم تحديث هذه السياسات من وقت لآخر نتيجة لتطوير NEOMART أو إضافة خدمات جديدة أو تغيير طرق الدفع أو التوصيل أو التخزين أو المتطلبات القانونية.",
          "سيتم نشر النسخة المحدثة داخل التطبيق وعلى صفحة السياسات الرسمية. ويعتبر استمرار استخدام التطبيق بعد تحديث السياسات إقرارًا بالاطلاع على النسخة المحدثة، بالقدر الذي يسمح به القانون.",
        ],
      },
    ],
  },
];

const POLICY_EN: Record<string, { title: string; summary: string; blocks: PolicyBlock[] }> = {
  privacy: {
    title: "Privacy Policy",
    summary: "How we handle and protect your information while you use NEOMART.",
    blocks: [
      { title: "Introduction", paragraphs: ["At NEOMART, we respect user privacy and are committed to protecting personal information handled through the app.", "This policy explains what information may be collected, entered, or stored, why it is used, how it is protected, and the rights available to users.", "This policy applies to the NEOMART app and related services."] },
      { title: "Information we may collect", items: ["Name and phone number.", "Delivery details and order information.", "Products or services requested.", "Notes related to the order or delivery.", "Technical information such as device type, operating system, app version, connection data, or errors, depending on the services and libraries used."] },
      { title: "Why we use this information", items: ["Creating and processing orders and contacting customers about them.", "Preparing, delivering, and tracking orders.", "Processing replacement, refund, or warranty requests.", "Providing customer support and protecting the app from unauthorized use.", "Fixing technical issues and improving app performance and user experience."], paragraphs: ["We do not use data for purposes unrelated to the reason it was collected unless legally permitted or the required consent has been obtained."] },
      { title: "Telegram order notifications", paragraphs: ["NEOMART uses Telegram through a dedicated bot to send new-order notifications to the NEOMART team or people authorized to process orders.", "Order notifications may include information necessary to fulfill the order, such as:"], items: ["Customer name.", "Phone number.", "Delivery address.", "Order notes.", "Requested products.", "Order value.", "Payment method.", "Order code."] },
      { title: "Use and protection of Telegram notification data", paragraphs: ["This information is used through Telegram only to notify the team responsible for orders, process orders, carry out deliveries, and provide customer service. It is not made public or used for marketing purposes.", "Access to NEOMART notification bots and channels is restricted to authorized people, and appropriate measures are taken to protect order data from unauthorized access."] },
      { title: "Data storage and sharing", paragraphs: ["Order data and related information may be stored on technical systems and servers used to operate NEOMART, including the database and hosting services used by the app.", "We do not sell customer personal data. Information may be shared only as necessary with authorized NEOMART staff, hosting and database providers, delivery services, or government and legal authorities when disclosure is required by law."] },
      { title: "Data protection and retention", paragraphs: ["We use appropriate technical and organizational measures to help protect data, including access controls, secure communications, restricted access, and server and database safeguards.", "No electronic method can be guaranteed to be 100% secure, so absolute protection from every cyber risk cannot be promised.", "We retain data as long as needed to provide services, manage orders, support customers, process refunds, replacements, warranties, and meet legal or accounting obligations. When no longer needed, data is deleted, destroyed, or de-identified where possible."] },
      { title: "Data deletion and user rights", paragraphs: ["Users may request deletion of their personal data or ask about data associated with them by email. Requests are reviewed according to the data we hold and any legal or operational obligations that require certain records to be retained.", "NEOMART is not intended to independently collect or target children’s data. If such data is discovered, you may contact us so we can take appropriate action."] },
      { title: "Third-party services and changes", paragraphs: ["The app may use external services, libraries, or tools needed for certain features. These services may process technical or other data according to their integration and policies. We review the external services used and seek to operate them consistently with privacy, security, and Google Play requirements.", "We may update this policy when the app, services, or legal requirements change. The latest review information will be reflected on this page, and additional in-app notice may be provided when needed."] },
    ],
  },
  returns: {
    title: "Refund & Replacement Policy",
    summary: "The requirements and process for returning or replacing products.",
    blocks: [
      { title: "Returns or replacements", paragraphs: ["Customers may request a return or replacement within 5 days of delivery, provided that:"], items: ["The product is in its original condition.", "It has not been used or damaged through misuse.", "Accessories and packaging, where applicable, are in suitable condition.", "Proof of purchase is provided when needed."] },
      { title: "Incorrect or defective products", paragraphs: ["If the delivered product is different from the requested product, or has a manufacturing defect or a clear issue upon delivery, contact NEOMART so we can review the case.", "When the error is from NEOMART or the product is defective under the warranty terms, NEOMART covers replacement, return, and delivery costs according to the case."] },
      { title: "Damage caused by misuse", paragraphs: ["Refunds or replacements do not cover damage caused by:"], items: ["Misuse or use contrary to the instructions.", "Breakage or damage caused by the customer.", "Incorrect storage.", "Unauthorized modifications or repairs."] },
      { title: "Request process and review time", paragraphs: ["Customers can contact support through WhatsApp and attach clear photos or video of the product when there is a defect or order discrepancy.", "Refund or replacement requests are reviewed after the required details are received, and the customer is informed of the appropriate action and expected timeline."] },
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    summary: "Delivery times, customer responsibilities, and cash-on-delivery information.",
    blocks: [
      { title: "Expected delivery time", items: ["Baghdad: 1–3 days.", "Other governorates: 2–4 days."], paragraphs: ["Delivery times may vary due to operational conditions, weather, public holidays, or factors outside NEOMART’s control."] },
      { title: "Order tracking", paragraphs: ["When a tracking number is available, it will be provided after the order is prepared so the customer can follow the shipment status."] },
      { title: "Delivery details", paragraphs: ["Customers are responsible for providing accurate and complete delivery information, including:"], items: ["Name and phone number.", "Governorate and area."] },
      { title: "Unreceived orders", paragraphs: ["If delivery cannot be completed because the customer does not answer, is unavailable, or provides incorrect information, delivery may be rescheduled or the order may be canceled depending on the case."] },
      { title: "Cash on delivery", paragraphs: ["Cash on delivery is available for orders that support this method. The customer must pay the confirmed order amount upon receipt."] },
    ],
  },
  warranty: {
    title: "Warranty Policy",
    summary: "Manufacturing defect coverage, reporting steps, and possible outcomes.",
    blocks: [
      { title: "Warranty period and coverage", paragraphs: ["Products covered by warranty have a 6-month warranty against manufacturing defects, starting from the delivery date.", "The warranty covers manufacturing defects that appear during normal use within the warranty period."] },
      { title: "Exclusions", paragraphs: ["The warranty does not cover damage caused by:"], items: ["Misuse, breakage, or impact.", "Liquids or moisture when the product is not designed to withstand them.", "Use contrary to product instructions.", "Repair or modification by an unauthorized party.", "Neglect or unsuitable storage."] },
      { title: "Reporting a problem", paragraphs: ["Please contact NEOMART within 28 hours of discovering the issue or receiving the product, depending on the case, and provide a clear photo or video when requested. The case will be reviewed to determine whether it is covered."] },
      { title: "Warranty outcome", paragraphs: ["When a covered manufacturing defect is confirmed, the possible outcome may be:"], items: ["Product replacement.", "Product repair where possible.", "A refund according to the case and product availability."] },
    ],
  },
  payment: {
    title: "Payment Policy",
    summary: "Available payment methods and what to know before confirming an order.",
    blocks: [
      { title: "Available payment methods", paragraphs: ["NEOMART provides the payment methods shown in the app or during checkout. The current method is cash on delivery unless additional methods are made available in the app."] },
      { title: "Order amount", paragraphs: ["Product prices, services, and delivery fees where applicable are shown before order confirmation whenever possible."] },
      { title: "Cash on delivery", paragraphs: ["When cash on delivery is selected, the amount due is paid when the order arrives according to the confirmed order value."] },
      { title: "Electronic payments", paragraphs: ["If an electronic payment method is added in the future, its terms and processing method will be explained before the payment is completed."] },
    ],
  },
  terms: {
    title: "Terms of Use",
    summary: "The general rules for using the app, placing orders, and using NEOMART services.",
    blocks: [
      { title: "App use and orders", paragraphs: ["NEOMART must be used for lawful purposes and in accordance with applicable laws and policies.", "When placing an order, users must provide accurate and complete information that helps fulfill and deliver the order."] },
      { title: "Prices, products, and availability", paragraphs: ["We aim to display accurate product, price, and availability information, but unintentional errors may occur. If a material error exists, we may contact the customer to confirm, change, or cancel the order.", "Some products may become unavailable or sell out after an order is placed. We may contact the customer with an alternative, an order change, or cancellation as appropriate."] },
      { title: "Misuse of the app", paragraphs: ["The app may not be used for:"], items: ["Attempting unauthorized access to systems.", "Exploiting vulnerabilities or attempting to disrupt the service.", "Entering fraudulent information.", "Using the app in a way that harms users or NEOMART.", "Automated operations or unauthorized access attempts to systems or databases."] },
      { title: "Order cancellation and intellectual property", paragraphs: ["NEOMART may refuse or cancel an order for a legitimate reason, such as suspected fraud, a material product or price error, product unavailability, or a delivery information problem.", "All NEOMART elements, including the name, logo, designs, text, images, interfaces, and content, belong to NEOMART or are used under appropriate rights or licenses and may not be copied or commercially reused without permission."] },
    ],
  },
  security: {
    title: "Information Security Policy",
    summary: "Measures used to help protect our systems and user data.",
    blocks: [
      { title: "Protection measures", paragraphs: ["We seek to protect NEOMART systems and user data from unauthorized access through technical and organizational measures."], items: ["Access permission controls.", "Protection of system keys and secrets.", "Secure communication between the app and backend services.", "Database protection and monitoring of sensitive operations.", "Security event logging when needed and keeping systems and software components updated.", "Emergency actions when suspicious activity is detected."] },
      { title: "Security incidents", paragraphs: ["If a security incident materially affects data, it will be handled according to applicable security and legal procedures."] },
    ],
  },
  support: {
    title: "Communication & Customer Support",
    summary: "Available channels for questions about orders, products, and data.",
    blocks: [
      { title: "Support topics", paragraphs: ["Customers can contact NEOMART about:"], items: ["Orders and delivery.", "Products.", "Replacements and refunds.", "Warranty.", "Privacy and data."] },
      { title: "Contact details", paragraphs: ["The contact number and customer support details are shown in the contact card below each policy. You can also email us through the official address."] },
    ],
  },
  updates: {
    title: "Policy Updates",
    summary: "How we handle policy updates when the app or services change.",
    blocks: [
      { title: "Updates and notice", paragraphs: ["These policies may be updated when NEOMART develops, adds services, changes payment or delivery methods, changes storage practices, or responds to legal requirements.", "The updated version will be published in the app and on the official policies page. Continuing to use the app after an update means acknowledging the updated version to the extent permitted by law."] },
    ],
  },
};

function getPolicyContent(policy: Policy, language: "ar" | "en") {
  return language === "en" ? POLICY_EN[policy.id] ?? policy : policy;
}

function PolicyContact() {
  const { text } = useLocale();

  return (
    <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <p className="text-xs font-bold text-foreground">{text("للاستفسار عن هذه السياسة", "Questions about this policy")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/12 px-3 py-2 text-xs font-bold text-[#168c43] transition hover:bg-[#25D366]/20"
        >
          <MessageCircle className="h-4 w-4" />
          {text("واتساب", "WhatsApp")}: {PHONE}
        </a>
        <a
          href={EMAIL_URL}
          className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-xs font-bold text-muted-foreground transition hover:text-primary"
        >
          <Mail className="h-4 w-4" />
          {text("البريد الإلكتروني", "Email")}
        </a>
      </div>
    </div>
  );
}

export function PoliciesPage() {
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const [appVersion, setAppVersion] = useState(APP_VERSION_FALLBACK);

  useEffect(() => {
    let active = true;
    void getAppVersion().then((version) => {
      if (active) setAppVersion(version);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div dir={direction} className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {text("رجوع", "Back")}
          </button>
          <h1 className="text-sm font-bold">{text("السياسات والشروط", "Policies & terms")}</h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 sm:py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-[oklch(0.7_0.17_320)]/10 p-6 shadow-soft sm:p-8">
          <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1.5 text-xs font-bold text-primary">
              <Building2 className="h-3.5 w-3.5" />
              {text(`السياسات الرسمية لـ ${COMPANY}`, `${COMPANY} official policies`)}
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{text("سياسات وشروط NEOMART", "NEOMART policies & terms")}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
              {text("توضح هذه الصفحة السياسات والشروط المنظمة لاستخدام تطبيق NEOMART وخدمات التسوق والطلبات والتوصيل والضمان والاستبدال والاسترداد وحماية بيانات المستخدمين.", "This page explains the policies and terms governing the NEOMART app, shopping, orders, delivery, warranty, replacements, refunds, and user data protection.")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-background/70 px-3 py-2">{text("آخر مراجعة: النسخة الحالية", "Latest review: Current version")}</span>
              <span className="rounded-full bg-background/70 px-3 py-2">{text(`إصدار التطبيق: ${appVersion}`, `App version: ${appVersion}`)}</span>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              {text("باستخدام التطبيق، فإنك تقر بأنك قرأت هذه السياسات وفهمتها، وتوافق على تطبيقها ضمن الحدود التي يسمح بها القانون والأنظمة المعمول بها.", "By using the app, you confirm that you have read and understood these policies and agree to them within the limits permitted by applicable law.")}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-border/50 bg-card/60 p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            <h2 className="font-bold">{text("استكشف السياسات", "Explore policies")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {POLICIES.map((policy) => {
              const content = getPolicyContent(policy, language);
              const Icon = policy.icon;
              return (
                <a
                  key={policy.id}
                  href={`#${policy.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-3 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                    {policy.number}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold group-hover:text-primary">{content.title}</span>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </a>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          {POLICIES.map((policy) => {
            const content = getPolicyContent(policy, language);
            const Icon = policy.icon;
            return (
              <section
                key={policy.id}
                id={policy.id}
                className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/50 bg-card/70 shadow-soft"
              >
                <div className={`border-b border-border/50 bg-gradient-to-br ${policy.accent} p-5 sm:p-6`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background/75 text-sm font-black text-primary shadow-sm">
                      {policy.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-black">{content.title}</h2>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{content.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5">
                    {content.blocks.map((block, index) => (
                      <div key={`${content.title}-${block.title ?? index}`} className="flex flex-col gap-2">
                        {block.title && <h3 className="text-sm font-black text-foreground">{block.title}</h3>}
                        {block.paragraphs?.map((paragraph) => (
                          <p key={paragraph} className="text-sm leading-8 text-muted-foreground">
                            {paragraph}
                          </p>
                        ))}
                        {block.items && (
                          <ul className="flex flex-col gap-2 rounded-2xl bg-muted/35 p-4 text-sm leading-7 text-muted-foreground">
                            {block.items.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <PolicyContact />
                </div>
              </section>
            );
          })}
        </div>

        <section id="company" className="scroll-mt-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-soft sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black">{text("معلومات الجهة المسؤولة", "Responsible entity")}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text("بيانات NEOMART الرسمية للتواصل والاستفسارات.", "Official NEOMART details for contact and inquiries.")}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">{text("اسم التطبيق والشركة", "App and company name")}</p>
              <p className="mt-1 font-bold">{COMPANY}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">{text("إصدار التطبيق", "App version")}</p>
              <p className="mt-1 font-bold">{appVersion}</p>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="rounded-2xl border border-border/50 bg-background/60 p-4 transition hover:border-primary/40">
              <p className="text-xs text-muted-foreground">{text("رقم التواصل عبر واتساب", "WhatsApp contact number")}</p>
              <p className="mt-1 font-bold text-primary">{PHONE}</p>
            </a>
            <a href={EMAIL_URL} className="rounded-2xl border border-border/50 bg-background/60 p-4 transition hover:border-primary/40">
              <p className="text-xs text-muted-foreground">{text("البريد الإلكتروني", "Email")}</p>
              <p className="mt-1 break-all font-bold text-primary">{EMAIL}</p>
            </a>
            <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="rounded-2xl border border-border/50 bg-background/60 p-4 transition hover:border-primary/40 sm:col-span-2">
              <p className="text-xs text-muted-foreground">{text("الموقع الإلكتروني الرسمي", "Official website")}</p>
              <p className="mt-1 font-bold text-primary">{WEBSITE}</p>
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/50 pt-5">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/12 px-4 py-2.5 text-xs font-bold text-[#168c43] transition hover:bg-[#25D366]/20">
              <MessageCircle className="h-4 w-4" />
              {text("تواصل عبر واتساب", "Contact on WhatsApp")}
            </a>
            <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/15">
              <Globe2 className="h-4 w-4" />
              {text("زيارة الموقع الرسمي", "Visit official website")}
            </a>
            <a href={EMAIL_URL} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:text-primary">
              <Mail className="h-4 w-4" />
              {text("مراسلتنا بالبريد", "Email us")}
            </a>
          </div>
        </section>

        <p className="pb-4 text-center text-xs leading-6 text-muted-foreground">
          {text("آخر تحديث للسياسات: النسخة الحالية. تم إعداد هذه السياسات لتوضيح طريقة استخدام NEOMART وخدماته، وتتم مراجعتها عند تغيّر الخدمات أو المتطلبات القانونية.", "Latest policy update: Current version. These policies explain how NEOMART and its services are used and are reviewed when services or legal requirements change.")}
        </p>
      </main>
    </div>
  );
}
