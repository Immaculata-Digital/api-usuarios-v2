export interface CreateUserDTO {
  fullName: string
  login: string
  email: string
  groupIds: string[]
  password?: string | undefined
  allowFeatures?: string[] | undefined
  deniedFeatures?: string[] | undefined
  lojasGestoras?: number[] | undefined
  createdBy: string
}

