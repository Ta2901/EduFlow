import { create } from 'zustand'
import { api, ApiError } from '../api/client'
import type { ClassRoom, Submission, Task, TaskAttachment } from '../types'

interface StudentProfile {
  id: string
  name: string
  email: string
}

interface CreateClassInput {
  title: string
  description: string
}

interface CreateTaskInput {
  classId: string
  title: string
  description: string
  dueDate: string
  attachments: TaskAttachment[]
  files?: File[]
}

interface SubmitWorkInput {
  taskId: string
  content: string
  files?: File[]
}

interface EduState {
  classes: ClassRoom[]
  tasks: Task[]
  submissions: Submission[]
  isLoaded: boolean
  refresh: () => Promise<void>
  getClassById: (id: string) => ClassRoom | undefined
  getClassByCode: (code: string) => ClassRoom | undefined
  getClassesByTeacher: (teacherId: string) => ClassRoom[]
  getClassesByStudent: (studentId: string, studentEmail: string) => ClassRoom[]
  joinClassByCode: (code: string, _student: StudentProfile) => Promise<{ ok: boolean; error?: string; classId?: string }>
  createClass: (input: CreateClassInput) => Promise<ClassRoom>
  createTask: (input: CreateTaskInput) => Promise<Task>
  getTasksByClass: (classId: string) => Task[]
  getTaskById: (id: string) => Task | undefined
  getSubmissionsByTask: (taskId: string) => Submission[]
  getSubmissionStats: (taskId: string) => { submitted: number; total: number; late: number }
  getStudentSubmission: (taskId: string, studentId: string) => Submission | undefined
  getStudentSubmissions: (studentId: string) => Submission[]
  submitWork: (input: SubmitWorkInput) => Promise<{ ok: boolean; error?: string }>
  gradeSubmission: (
    submissionId: string,
    grade: number,
    maxGrade: number,
    feedback: string
  ) => Promise<void>
}

export const useEduStore = create<EduState>((set, get) => ({
  classes: [],
  tasks: [],
  submissions: [],
  isLoaded: false,

  refresh: async () => {
    const data = await api.edu.context()
    set({
      classes: data.classes,
      tasks: data.tasks,
      submissions: data.submissions,
      isLoaded: true,
    })
  },

  getClassById: (id) => get().classes.find((c) => c.id === id),

  getClassByCode: (code) =>
    get().classes.find((c) => c.classCode.toUpperCase() === code.trim().toUpperCase()),

  getClassesByTeacher: (teacherId) =>
    get().classes.filter((c) => c.teacherId === teacherId),

  getClassesByStudent: (studentId, studentEmail) => {
    const email = studentEmail.toLowerCase()
    return get().classes.filter((c) =>
      c.students.some((s) => s.id === studentId || s.email.toLowerCase() === email)
    )
  },

  createClass: async (input) => {
    const { classroom } = await api.edu.createClass(input)
    await get().refresh()
    return classroom
  },

  joinClassByCode: async (code) => {
    try {
      const { classId } = await api.edu.joinClass(code)
      await get().refresh()
      return { ok: true, classId }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Không thể tham gia lớp' }
    }
  },

  createTask: async (input) => {
    const form = new FormData()
    form.append('title', input.title)
    form.append('description', input.description)
    form.append('dueDate', input.dueDate)
    if (input.files) {
      input.files.forEach((f) => form.append('files', f))
    }
    const { task } = await api.edu.createTask(input.classId, form)
    await get().refresh()
    return task
  },

  getTasksByClass: (classId) => get().tasks.filter((t) => t.classId === classId),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getSubmissionsByTask: (taskId) => get().submissions.filter((s) => s.taskId === taskId),

  getSubmissionStats: (taskId) => {
    const subs = get().getSubmissionsByTask(taskId)
    return {
      total: subs.length,
      submitted: subs.filter((s) => s.status === 'submitted' || s.status === 'late').length,
      late: subs.filter((s) => s.status === 'late').length,
    }
  },

  getStudentSubmission: (taskId, studentId) =>
    get().submissions.find((s) => s.taskId === taskId && s.studentId === studentId),

  getStudentSubmissions: (studentId) =>
    get().submissions.filter((s) => s.studentId === studentId),

  submitWork: async (input) => {
    try {
      const form = new FormData()
      form.append('content', input.content)
      if (input.files) {
        input.files.forEach((f) => form.append('files', f))
      }
      await api.edu.submitWork(input.taskId, form)
      await get().refresh()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : 'Nộp bài thất bại' }
    }
  },

  gradeSubmission: async (submissionId, grade, maxGrade, feedback) => {
    await api.edu.gradeSubmission(submissionId, { grade, maxGrade, feedback })
    await get().refresh()
  },
}))
