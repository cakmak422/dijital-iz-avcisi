export type EditableContentKey =
  | "home.hero.title"
  | "home.hero.description"
  | "home.about.text"
  | "home.cyberNews.title"
  | "home.cyberNews.description"
  | "home.securityCenter.description"
  | "home.footer.description"
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
