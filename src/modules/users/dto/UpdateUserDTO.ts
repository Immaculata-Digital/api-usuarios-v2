export interface UpdateUserDTO {
  fullName?: string | undefined
  login?: string | undefined
  email?: string | undefined
  groupIds?: string[] | undefined
  allowFeatures?: string[] | undefined
  deniedFeatures?: string[] | undefined
  lojasGestoras?: number[] | undefined
  updatedBy: string
}

