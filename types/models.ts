// Json file types
export interface JsonFile {
  _id: string;
  name: string;
  content: string;
  description?: string;
  groupId: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface JsonEditFormData {
  name: string;
  slug: string;
  description: string;
  group?: Group;
  currentFile?: JsonFile;
}

// Group types
export interface Group {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  allowPublicWrite: boolean;
  protected: boolean;
}

export interface GroupResponse {
  success: boolean;
  message?: string;
  group: Group;
}

// Account types

export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  _id: string;
  apiKey: string;
  createdAt: Date;
  lastUsed?: Date;
  userId: string;
  name: string;
  expiresAt?: Date;
  isActive: boolean;
}

// Auth types
export interface LoginBody {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

export interface AuthError {
  data?: {
    message: string;
  };
  message?: string;
  status?: number;
}

export interface RegisterBody {
  username: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  message: string;
}

// Api error types

export interface ApiError {
  data?: {
    message: string;
  };
  message?: string;
}
