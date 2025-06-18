// lib/auth.ts
import bcrypt from "bcryptjs"
import { executeQuery } from "./db"

export interface User {
  id: number
  email: string
  full_name: string
  role: "user" | "admin"
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, fullName: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password)
    
    const result = await executeQuery(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email, hashedPassword, fullName]
    ) as any

    if (result.insertId) {
      const users = await executeQuery(
        'SELECT id, email, full_name, role FROM users WHERE id = ?',
        [result.insertId]
      ) as any[]

      return users[0] as User
    }
    
    return null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const users = await executeQuery(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?',
      [email]
    ) as any[]

    if (users.length === 0) return null

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) return null

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    }
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}