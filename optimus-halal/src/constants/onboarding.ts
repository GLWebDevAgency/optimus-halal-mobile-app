/**
 * Onboarding Data
 * 
 * Contenu des slides d'onboarding
 */

export interface OnboardingSlide {
  id: string;
  title: string;
  highlightedText: string;
  description: string;
  imageUrl: string;
  badgeIcon: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "scan",
    title: "Scannez. Vérifiez.",
    highlightedText: "Consommez Halal.",
    description:
      "Identifiez instantanément les produits certifiés grâce à notre technologie de scan avancée.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDImDppU-2MF0aZuiZIxspRAgHxQc8HWsfxyImqkaFYXrYrix_FgRBkqXjMfps8yHlI5yYICVKbTIjVyh96Vz8Nmwx8CuKLgbo7aPoVK42rejXK4RonK5JOGnWu8BkMF0vP1fXPFBYkb9PxynpKAVXDflwXpyR9MO4JeWXvyw13DzPbP3kTArfTfh427UYK6d_isTqh1-B3D5rttPSllYW9o4ojB4Kcp4284WsXOIBAogktNqnZm8-QDrdaxJOMH7MC5sDUMPhQdRTU",
    badgeIcon: "verified",
  },
  {
    id: "certifications",
    title: "Des certifications",
    highlightedText: "fiables et traçables",
    description:
      "Nous vérifions chaque étape de la chaîne d'approvisionnement pour vous garantir une transparence totale et une conformité éthique rigoureuse.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqlfZYXbJbjWBuC4BGCxMeObl3lOnTjQbBSKYymMRGXitZLG-E31ddmc8HSC7s1iP6GQBItOnZoyV--RhX_xuxDYPb7UwL8Q8uuv_SfdkanoB10fTIBmoScwnZ-pI_Ddk-BNTwn7S56h2NouNUYuzgwqBb4EZgC2GG1wV5XzrCaJr87ydfLYGebBTcXDwSOTjtbPVMQw5Grz_rnWTcTUCIs418mcqxIJuSfuFY-E_qDBD_kPnLVc5tEXm28Pazc46YH4ayY63iutH0",
    badgeIcon: "star",
  },
  {
    id: "ethical",
    title: "Éthique, Bio,",
    highlightedText: "Responsable",
    description:
      "Au-delà du halal, nous mettons en avant les produits bio, équitables et respectueux de l'environnement pour une consommation consciente.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLGDyyFngcYlOwZcMBzQCFRSNPYZiiaiKx7vWGn0di4zYjUGmS9BbmFtR-Js_lJ_uFWqD7NbdEGOaQovwHxLfpu6ZpoTOCA35Ef-Yuh4C-2wJLCOK2UTxDG2VYAF1HcqMeRcSlebqQCJF1nagbwElTWOQfk4pMhRCCGwR2YLFc8hYYBDsBIQ8UL4-GUTVMjMA4uL2GiaP02-K3CJu1M_ve6C1B3--qB1mK01hoTck3h52eyzJ43Po7efke0B4nmxyR3f2cWveqeba",
    badgeIcon: "eco",
  },
];
