import { randomUUID } from 'crypto'

export interface AccessGroupProps {
  id: string
  name: string
  code: string
  features: string[]
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
}

export type CreateAccessGroupProps = Omit<AccessGroupProps, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateAccessGroupProps = {
  name?: string | undefined
  code?: string | undefined
  features?: string[] | undefined
  updatedBy: string
}

export class AccessGroup {
  private constructor(private props: AccessGroupProps) { }

  static create(data: CreateAccessGroupProps) {
    const timestamp = new Date()
    return new AccessGroup({
      ...data,
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  static restore(props: AccessGroupProps) {
    return new AccessGroup(props)
  }

  update(data: UpdateAccessGroupProps) {
    const nextProps: AccessGroupProps = { ...this.props }

    if (typeof data.name !== 'undefined') {
      nextProps.name = data.name
    }

    if (typeof data.code !== 'undefined') {
      nextProps.code = data.code
    }

    if (typeof data.features !== 'undefined') {
      nextProps.features = data.features
    }

    nextProps.updatedBy = data.updatedBy
    nextProps.updatedAt = new Date()

    this.props = nextProps
  }

  toJSON(): AccessGroupProps {
    return { ...this.props }
  }
}

