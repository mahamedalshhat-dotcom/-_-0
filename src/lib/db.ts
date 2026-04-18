import Dexie, { type Table } from 'dexie';

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  id: number;
  surahId: number;
  numberInSurah: number;
  text: string;
  translation?: string;
  audio?: string;
}

export interface Dhikr {
  id?: number;
  category: string;
  text: string;
  translation?: string;
  count: number;
  currentCount: number;
}

export interface UserSettings {
  id: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  calculationMethod?: string;
  asrMethod?: string;
  locationMethod?: 'auto' | 'manual';
  manualLocation?: {
    city: string;
    country: string;
  };
  theme?: 'light' | 'dark' | 'sepia';
  fontSize?: number;
  adhkarSound?: string;
  notifications?: boolean;
  prePrayerAlert?: boolean;
  prePrayerTime?: number;
  notificationSound?: string;
  silentMode?: boolean;
}

export interface CustomSound {
  id: string;
  name: string;
  data: Blob;
  type: string;
  createdAt: number;
}

export class NoorDatabase extends Dexie {
  surahs!: Table<Surah>;
  ayahs!: Table<Ayah>;
  adhkar!: Table<Dhikr>;
  settings!: Table<UserSettings>;
  customSounds!: Table<CustomSound>;

  constructor() {
    super('NoorAlHudaDB');
    this.version(2).stores({
      surahs: 'id, name, englishName',
      ayahs: 'id, surahId, numberInSurah',
      adhkar: '++id, category',
      settings: 'id',
      customSounds: 'id, name'
    });
  }
}

export const db = new NoorDatabase();
