export const PROFILE_UPDATED_EVENT = 'profile:updated';

export interface ProfileUpdatedDetail {
  fullName: string;
  profilePhotoUrl: string | null;
}

export const emitProfileUpdated = (detail: ProfileUpdatedDetail): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, { detail }));
};
