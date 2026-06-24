import { Memory } from './Memory';

export interface Deceased {
  _id?: string;
  fullName: string;
  birthDate?: string | Date;
  deathDate?: string | Date;
  biography?: string;
  story?: string;
  isFamous?: boolean;
  graveId?: string;
  deceasedImage?: string | null;
  images?: string[];
  memories?: Memory[];
  assignedUsers?: Array<{ _id?: string; [key: string]: any }>;
  graveDetails?: {
    section?: string;
    plotNumber?: string;
    coordinates?: any;
    status?: string;
  } | null;
  cemeteryId?: string;
}
