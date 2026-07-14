import type { ClassRoom, Submission, Task } from './types'

export const DEMO_STUDENTS = [
  { id: 's1', name: 'Nguyễn Văn An', email: 'an.nguyen@student.edu' },
  { id: 's2', name: 'Trần Thị Bình', email: 'binh.tran@student.edu' },
  { id: 's3', name: 'Lê Văn Cường', email: 'cuong.le@student.edu' },
  { id: 's4', name: 'Phạm Thị Dung', email: 'dung.pham@student.edu' },
  { id: 's5', name: 'Hoàng Văn Em', email: 'em.hoang@student.edu' },
]

export function createDemoClasses(teacherId: string): ClassRoom[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'class-demo-1',
      title: 'Toán học lớp 10A1',
      description: 'Khóa học toán học cơ bản cho học sinh lớp 10',
      classCode: 'MATH10A',
      teacherId,
      status: 'active',
      students: DEMO_STUDENTS.slice(0, 5),
      createdAt: now,
    },
    {
      id: 'class-demo-2',
      title: 'Toán học lớp 10A2',
      description: 'Khóa học toán học nâng cao lớp 10',
      classCode: 'MATH10B',
      teacherId,
      status: 'active',
      students: DEMO_STUDENTS.slice(0, 4),
      createdAt: now,
    },
  ]
}

export function createDemoTasks(teacherId: string): Task[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'task-demo-1',
      classId: 'class-demo-1',
      title: 'Bài tập phương trình bậc nhất',
      description: 'Giải các bài tập từ 1 đến 15 trong sách giáo khoa trang 42-45.',
      dueDate: '2026-05-25',
      attachments: [
        { id: 'att-1', name: 'de-bai.pdf', size: 245000, type: 'application/pdf' },
      ],
      teacherId,
      createdAt: now,
    },
    {
      id: 'task-demo-2',
      classId: 'class-demo-1',
      title: 'Kiểm tra 15 phút chương 1',
      description: 'Kiểm tra kiến thức phương trình bậc nhất và bậc hai.',
      dueDate: '2026-05-28',
      attachments: [],
      teacherId,
      createdAt: now,
    },
  ]
}

export function createDemoSubmissions(): Submission[] {
  return [
    {
      id: 'sub-1',
      taskId: 'task-demo-1',
      studentId: 's1',
      studentName: 'Nguyễn Văn An',
      studentEmail: 'an.nguyen@student.edu',
      status: 'submitted',
      submittedAt: '2026-05-18T10:30:00',
      content: 'Đã hoàn thành bài tập 1-15, nộp file PDF.',
      grade: 9,
      maxGrade: 10,
      feedback: 'Bài làm tốt, trình bày rõ ràng. Cần chú ý bài 12 phần c.',
      gradedAt: '2026-05-19T09:00:00',
    },
    {
      id: 'sub-2',
      taskId: 'task-demo-1',
      studentId: 's2',
      studentName: 'Trần Thị Bình',
      studentEmail: 'binh.tran@student.edu',
      status: 'submitted',
      submittedAt: '2026-05-19T14:20:00',
    },
    {
      id: 'sub-3',
      taskId: 'task-demo-1',
      studentId: 's3',
      studentName: 'Lê Văn Cường',
      studentEmail: 'cuong.le@student.edu',
      status: 'late',
      submittedAt: '2026-05-21T08:00:00',
    },
    {
      id: 'sub-4',
      taskId: 'task-demo-1',
      studentId: 's4',
      studentName: 'Phạm Thị Dung',
      studentEmail: 'dung.pham@student.edu',
      status: 'not_submitted',
    },
    {
      id: 'sub-5',
      taskId: 'task-demo-1',
      studentId: 's5',
      studentName: 'Hoàng Văn Em',
      studentEmail: 'em.hoang@student.edu',
      status: 'not_submitted',
    },
  ]
}
