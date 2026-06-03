export type EditableContentKey =
  | "home.hero.title"
  | "home.hero.description"
  | "about.page.title"
  | "about.page.description"
  | "about.mission.title"
  | "about.mission.text"
  | "about.vision.title"
  | "about.vision.text"
  | "home.about.text"
  | "home.cyberNews.title"
  | "home.cyberNews.description"
  | "home.securityCenter.description"
  | "home.guides.eyebrow"
  | "home.guides.title"
  | "home.guides.description"
  | "home.footer.title"
  | "home.footer.description"
  | "home.footer.supportEmail"
  | "home.footer.reportEmail"
  | "home.footer.copyright"
  | "contact.page.title"
  | "contact.page.description"
  | "contact.info.title"
  | "contact.info.description"
  | "contact.supportEmail"
  | "contact.reportEmail"
  | "contact.intro.text"
  | "home.announcement.banner"
  | "home.todayCyberEvent.text";

export type EditableContent = {
  id: string;
  key: EditableContentKey;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
};

export type EditableContentGroup = {
  id: string;
  title: string;
  description: string;
  keys: EditableContentKey[];
};
