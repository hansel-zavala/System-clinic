/** Grupos sanguíneos ABO/Rh habituales */
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export type BloodTypeValue = (typeof BLOOD_TYPES)[number] | ''
