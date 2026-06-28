export interface Project {
  id: string
  name: string
  description: string | null
  ownerId: string
  ownerName: string
  memberCount: number
  createdAt: string
}

export interface ColumnSummary {
  id: string
  name: string
  order: number
}

export interface ProjectDetail {
  id: string
  name: string
  description: string | null
  ownerId: string
  isOwner: boolean
  members: Member[]
  columns: ColumnSummary[]
  createdAt: string
}

export interface Member {
  userId: string
  name: string
  email: string
  role: string
}
