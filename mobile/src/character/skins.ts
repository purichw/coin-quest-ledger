import type { Gender } from './catalog';
export function skinOptions(classId: string, gender: Gender) {
  return [{ id: '', label: 'ชุดดั้งเดิม' }, ...(classId === 'archfiend' && gender === 'male' ? [{ id: 'crimson-regent', label: 'Crimson Regent' }, { id: 'archfiend-swimmer', label: 'Swimmer' }, { id: 'archfiend-swimmer-blackred', label: 'Black & Red' }] : []), ...(classId === 'tiderunner' ? [{ id: 'tiderunner-classic', label: 'Classic' }] : [])];
}
