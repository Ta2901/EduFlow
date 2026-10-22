import { localeOption, type Locale } from './catalog'

type NoticeLike = { type: string; title: string; message: string }

const CONTENT: Record<string, Partial<Record<Locale, string>>> = {
  'Toán học lớp 10A1': {
    en: 'Grade 10 math, class A1',
    ko: '수학 10학년 A1반',
    ja: '数学 10年 A1組',
    'zh-Hans': '十年级数学 A1班',
    'zh-Hant': '十年級數學 A1班',
    lzh: '算學十年甲一',
    mn: '10-р ангийн математик A1',
    th: 'คณิตศาสตร์ ม.4 ห้อง A1',
    id: 'Matematika kelas 10A1',
    fr: 'Mathématiques 10e A1',
    es: 'Matemáticas 10.º A1',
    de: 'Mathematik Klasse 10A1',
    ru: 'Математика, 10А1',
  },
  'Toán học lớp 10A2': {
    en: 'Grade 10 math, class A2',
    ko: '수학 10학년 A2반',
    ja: '数学 10年 A2組',
    'zh-Hans': '十年级数学 A2班',
    'zh-Hant': '十年級數學 A2班',
    lzh: '算學十年甲二',
    mn: '10-р ангийн математик A2',
    th: 'คณิตศาสตร์ ม.4 ห้อง A2',
    id: 'Matematika kelas 10A2',
    fr: 'Mathématiques 10e A2',
    es: 'Matemáticas 10.º A2',
    de: 'Mathematik Klasse 10A2',
    ru: 'Математика, 10А2',
  },
  'Khóa học toán học cơ bản cho học sinh lớp 10': {
    en: 'A basic math course for grade 10 students',
    ko: '10학년을 위한 기초 수학 강좌',
    ja: '高校1年向けの基礎数学',
    'zh-Hans': '面向十年级学生的基础数学课程',
    'zh-Hant': '面向十年級學生的基礎數學課程',
    lzh: '十年生徒之算學初課',
    mn: '10-р ангийн суурь математикийн хичээл',
    th: 'วิชาคณิตศาสตร์พื้นฐานสำหรับชั้นมัธยมศึกษาปีที่ 4',
    id: 'Kursus matematika dasar untuk kelas 10',
    fr: 'Cours de mathématiques de base pour la 10e',
    es: 'Curso básico de matemáticas para 10.º',
    de: 'Grundkurs Mathematik für die 10. Klasse',
    ru: 'Базовый курс математики для 10 класса',
  },
  'Khóa học toán học nâng cao lớp 10': {
    en: 'An advanced math course for grade 10',
    ko: '10학년 심화 수학 강좌',
    ja: '高校1年向けの発展数学',
    'zh-Hans': '十年级进阶数学课程',
    'zh-Hant': '十年級進階數學課程',
    lzh: '十年算學之進階',
    mn: '10-р ангийн гүнзгий математик',
    th: 'วิชาคณิตศาสตร์ขั้นสูงชั้นมัธยมศึกษาปีที่ 4',
    id: 'Kursus matematika lanjutan kelas 10',
    fr: 'Cours de mathématiques avancées pour la 10e',
    es: 'Curso avanzado de matemáticas de 10.º',
    de: 'Aufbaukurs Mathematik für die 10. Klasse',
    ru: 'Углублённый курс математики для 10 класса',
  },
  'Toán học': {
    en: 'Math',
    ko: '수학',
    ja: '数学',
    'zh-Hans': '数学',
    'zh-Hant': '數學',
    lzh: '算學',
    mn: 'Математик',
    th: 'คณิตศาสตร์',
    id: 'Matematika',
    fr: 'Mathématiques',
    es: 'Matemáticas',
    de: 'Mathematik',
    ru: 'Математика',
  },
  'Bài tập phương trình bậc nhất': {
    en: 'Linear equations practice',
    ko: '일차방정식 연습',
    ja: '一次方程式の演習',
    'zh-Hans': '一元一次方程练习',
    'zh-Hant': '一元一次方程式練習',
    lzh: '一次方程之習',
    mn: 'Нэгдүгээр зэргийн тэгшитгэлийн дасгал',
    th: 'แบบฝึกสมการเชิงเส้น',
    id: 'Latihan persamaan linear',
    fr: 'Exercices sur les équations du premier degré',
    es: 'Ejercicios de ecuaciones de primer grado',
    de: 'Übungen zu linearen Gleichungen',
    ru: 'Задания по линейным уравнениям',
  },
  'Giải các bài tập từ 1 đến 15 trong sách giáo khoa trang 42-45.': {
    en: 'Solve exercises 1 to 15 in the textbook, pages 42–45.',
    ko: '교과서 42–45쪽 1번부터 15번까지 푸세요.',
    ja: '教科書42–45ページの問1から15を解いてください。',
    'zh-Hans': '完成课本第42–45页第1题到第15题。',
    'zh-Hant': '完成課本第42–45頁第1題到第15題。',
    lzh: '解課本四十二至四十五頁第一至十五題。',
    mn: 'Сурах бичгийн 42–45-р нүүр, 1-ээс 15-р бодлогыг бодоорой.',
    th: 'ทำแบบฝึกหัดข้อ 1 ถึง 15 ในหนังสือหน้า 42–45',
    id: 'Kerjakan soal 1 sampai 15 di buku halaman 42–45.',
    fr: 'Résoudre les exercices 1 à 15 du manuel, pages 42 à 45.',
    es: 'Resuelve los ejercicios 1 a 15 del libro, páginas 42 a 45.',
    de: 'Löse die Aufgaben 1 bis 15 im Buch, Seiten 42–45.',
    ru: 'Решите задания 1–15 в учебнике, страницы 42–45.',
  },
  'Kiểm tra 15 phút chương 1': {
    en: '15-minute quiz, chapter 1',
    ko: '1단원 15분 평가',
    ja: '第1章 15分テスト',
    'zh-Hans': '第1章 15分钟测验',
    'zh-Hant': '第1章 15分鐘測驗',
    lzh: '第一章十五分之試',
    mn: '1-р бүлгийн 15 минутын шалгалт',
    th: 'ทดสอบ 15 นาที บทที่ 1',
    id: 'Kuis 15 menit bab 1',
    fr: 'Contrôle de 15 minutes, chapitre 1',
    es: 'Prueba de 15 minutos, capítulo 1',
    de: '15-Minuten-Test, Kapitel 1',
    ru: '15-минутная проверочная, глава 1',
  },
  'Kiểm tra kiến thức phương trình bậc nhất và bậc hai.': {
    en: 'Check your knowledge of linear and quadratic equations.',
    ko: '일차방정식과 이차방정식 내용을 확인합니다.',
    ja: '一次方程式と二次方程式の理解を確認します。',
    'zh-Hans': '考查一元一次方程和一元二次方程。',
    'zh-Hant': '考查一元一次方程式和一元二次方程式。',
    lzh: '試一次方程與二次方程。',
    mn: 'Нэг ба хоёрдугаар зэргийн тэгшитгэлийн мэдлэгээ шалгана.',
    th: 'ทดสอบความรู้เรื่องสมการเชิงเส้นและสมการกำลังสอง',
    id: 'Menguji persamaan linear dan kuadrat.',
    fr: 'Vérifier les équations du premier et du second degré.',
    es: 'Comprueba las ecuaciones de primer y segundo grado.',
    de: 'Prüft lineare und quadratische Gleichungen.',
    ru: 'Проверка линейных и квадратных уравнений.',
  },
}

const SOURCE_KEYS = Object.keys(CONTENT).sort((a, b) => b.length - a.length)

type Phrases = {
  overdueTitle: string
  dueSoonTitle: string
  overdueBody: string
  dueSoonBody: string
  newTaskTitle: string
  newTaskBody: string
  submittedTitle: string
  submittedBody: string
  onlineTitle: string
  onlineBody: string
  gradedTitle: string
  gradedBody: string
  practiceTitle: string
  practiceBody: string
  sessionEvalTitle: string
  sessionEvalBody: string
  courseEvalTitle: string
  courseEvalBody: string
  midterm: string
  final: string
  adminTitle: string
  adminBehind: string
  adminCheck: string
}

const PHRASES: Record<Locale, Phrases> = {
  vi: {
    overdueTitle: 'Quá hạn nộp bài',
    dueSoonTitle: 'Nhắc hạn nộp bài',
    overdueBody: 'Bài 「{task}」 đã quá hạn ({date})',
    dueSoonBody: 'Bài 「{task}」 sắp đến hạn ({date})',
    newTaskTitle: 'Bài tập mới',
    newTaskBody: '「{task}」 trong lớp {class}',
    submittedTitle: 'Học sinh đã nộp bài',
    submittedBody: '{name} đã nộp bài 「{task}」',
    onlineTitle: 'Lớp học online đang diễn ra',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Đã có điểm và nhận xét',
    gradedBody: 'Bài 「{task}」: {grade}/{max}',
    practiceTitle: 'Bài luyện tập mới',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Đánh giá buổi học',
    sessionEvalBody: 'Hãy đánh giá giáo viên sau buổi 「{session}」 — {class}',
    courseEvalTitle: 'Đánh giá {kind}',
    courseEvalBody: 'Vui lòng đánh giá khoá học 「{class}」 ({kind})',
    midterm: 'giữa kỳ',
    final: 'cuối kỳ',
    adminTitle: 'Nhắc nhở tiến độ giảng dạy',
    adminBehind: 'Lớp 「{class}」 đang chậm {count} buổi so với kế hoạch. Vui lòng cập nhật tiến độ giảng dạy.',
    adminCheck: 'Vui lòng kiểm tra và cập nhật kế hoạch giảng dạy lớp 「{class}」.',
  },
  en: {
    overdueTitle: 'Assignment overdue',
    dueSoonTitle: 'Deadline reminder',
    overdueBody: '「{task}」 is overdue ({date})',
    dueSoonBody: '「{task}」 is due soon ({date})',
    newTaskTitle: 'New assignment',
    newTaskBody: '「{task}」 in {class}',
    submittedTitle: 'A student submitted work',
    submittedBody: '{name} submitted 「{task}」',
    onlineTitle: 'Online class is live',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Grade and feedback are ready',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'New practice set',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Session evaluation',
    sessionEvalBody: 'Please rate the teacher after 「{session}」 — {class}',
    courseEvalTitle: '{kind} evaluation',
    courseEvalBody: 'Please evaluate the course 「{class}」 ({kind})',
    midterm: 'midterm',
    final: 'final',
    adminTitle: 'Teaching progress reminder',
    adminBehind: '「{class}」 is {count} sessions behind the plan. Please update the teaching progress.',
    adminCheck: 'Please review and update the teaching plan for 「{class}」.',
  },
  ko: {
    overdueTitle: '과제 마감이 지났습니다',
    dueSoonTitle: '과제 마감 알림',
    overdueBody: '「{task}」의 마감이 지났습니다 ({date})',
    dueSoonBody: '「{task}」의 마감이 곧입니다 ({date})',
    newTaskTitle: '새 과제',
    newTaskBody: '{class}의 「{task}」',
    submittedTitle: '학생이 과제를 제출했습니다',
    submittedBody: '{name} 님이 「{task}」를 제출했습니다',
    onlineTitle: '온라인 수업이 진행 중입니다',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: '점수와 피드백이 도착했습니다',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: '새 연습',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: '수업 평가',
    sessionEvalBody: '「{session}」 이후 교사를 평가해 주세요 — {class}',
    courseEvalTitle: '{kind} 평가',
    courseEvalBody: '강좌 「{class}」를 평가해 주세요 ({kind})',
    midterm: '중간',
    final: '기말',
    adminTitle: '수업 진도 알림',
    adminBehind: '「{class}」이 계획보다 {count}회 늦습니다. 진도를 업데이트해 주세요.',
    adminCheck: '「{class}」의 수업 계획을 확인하고 업데이트해 주세요.',
  },
  ja: {
    overdueTitle: '課題の期限が過ぎています',
    dueSoonTitle: '提出期限のお知らせ',
    overdueBody: '「{task}」は期限を過ぎています ({date})',
    dueSoonBody: '「{task}」の期限が近づいています ({date})',
    newTaskTitle: '新しい課題',
    newTaskBody: '{class}の「{task}」',
    submittedTitle: '生徒が課題を提出しました',
    submittedBody: '{name} が「{task}」を提出しました',
    onlineTitle: 'オンライン授業が進行中です',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: '点数とコメントが届きました',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: '新しい練習',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: '授業の評価',
    sessionEvalBody: '「{session}」のあと教員を評価してください — {class}',
    courseEvalTitle: '{kind}の評価',
    courseEvalBody: '講座「{class}」を評価してください ({kind})',
    midterm: '中間',
    final: '期末',
    adminTitle: '授業進度の通知',
    adminBehind: '「{class}」は計画より {count} 回遅れています。進度を更新してください。',
    adminCheck: '「{class}」の授業計画を確認して更新してください。',
  },
  'zh-Hans': {
    overdueTitle: '作业已逾期',
    dueSoonTitle: '作业截止提醒',
    overdueBody: '「{task}」已逾期 ({date})',
    dueSoonBody: '「{task}」即将到期 ({date})',
    newTaskTitle: '新作业',
    newTaskBody: '{class}的「{task}」',
    submittedTitle: '学生已提交作业',
    submittedBody: '{name} 提交了「{task}」',
    onlineTitle: '在线课堂正在进行',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: '已有分数和评语',
    gradedBody: '「{task}」：{grade}/{max}',
    practiceTitle: '新的练习',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: '课堂评价',
    sessionEvalBody: '请在「{session}」之后评价教师 — {class}',
    courseEvalTitle: '{kind}评价',
    courseEvalBody: '请评价课程「{class}」({kind})',
    midterm: '期中',
    final: '期末',
    adminTitle: '教学进度提醒',
    adminBehind: '「{class}」比计划慢了 {count} 节。请更新教学进度。',
    adminCheck: '请检查并更新「{class}」的教学计划。',
  },
  'zh-Hant': {
    overdueTitle: '作業已逾期',
    dueSoonTitle: '作業截止提醒',
    overdueBody: '「{task}」已逾期 ({date})',
    dueSoonBody: '「{task}」即將到期 ({date})',
    newTaskTitle: '新作業',
    newTaskBody: '{class}的「{task}」',
    submittedTitle: '學生已提交作業',
    submittedBody: '{name} 提交了「{task}」',
    onlineTitle: '線上課堂正在進行',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: '已有分數和評語',
    gradedBody: '「{task}」：{grade}/{max}',
    practiceTitle: '新的練習',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: '課堂評價',
    sessionEvalBody: '請在「{session}」之後評價教師 — {class}',
    courseEvalTitle: '{kind}評價',
    courseEvalBody: '請評價課程「{class}」({kind})',
    midterm: '期中',
    final: '期末',
    adminTitle: '教學進度提醒',
    adminBehind: '「{class}」比計畫慢了 {count} 節。請更新教學進度。',
    adminCheck: '請檢查並更新「{class}」的教學計畫。',
  },
  lzh: {
    overdueTitle: '納業已逾期',
    dueSoonTitle: '納期將至',
    overdueBody: '「{task}」已逾期 ({date})',
    dueSoonBody: '「{task}」期將至 ({date})',
    newTaskTitle: '新作業',
    newTaskBody: '{class}之「{task}」',
    submittedTitle: '生徒已納作業',
    submittedBody: '{name} 已納「{task}」',
    onlineTitle: '線上課方行',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: '已有分與評',
    gradedBody: '「{task}」：{grade}/{max}',
    practiceTitle: '新習',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: '課後之評',
    sessionEvalBody: '「{session}」畢，請評其師 — {class}',
    courseEvalTitle: '{kind}之評',
    courseEvalBody: '請評課「{class}」({kind})',
    midterm: '中',
    final: '終',
    adminTitle: '教程之提醒',
    adminBehind: '「{class}」遲於計畫 {count} 節。請更新進度。',
    adminCheck: '請檢「{class}」之教學計畫而更新之。',
  },
  mn: {
    overdueTitle: 'Даалгаврын хугацаа өнгөрсөн',
    dueSoonTitle: 'Хугацаа дөхөж байна',
    overdueBody: '「{task}」-ын хугацаа өнгөрсөн ({date})',
    dueSoonBody: '「{task}」-ын хугацаа дөхөж байна ({date})',
    newTaskTitle: 'Шинэ даалгавар',
    newTaskBody: '{class} ангийн 「{task}」',
    submittedTitle: 'Сурагч даалгавраа илгээлээ',
    submittedBody: '{name} 「{task}」-ыг илгээлээ',
    onlineTitle: 'Онлайн хичээл явж байна',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Оноо ба сэтгэгдэл ирлээ',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'Шинэ дасгал',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Хичээлийн үнэлгээ',
    sessionEvalBody: '「{session}」-ын дараа багшаа үнэлнэ үү — {class}',
    courseEvalTitle: '{kind} үнэлгээ',
    courseEvalBody: '「{class}」 хичээлийг үнэлнэ үү ({kind})',
    midterm: 'улирлын дунд',
    final: 'улирлын төгсгөл',
    adminTitle: 'Хичээлийн явцын сануулга',
    adminBehind: '「{class}」 төлөвлөгөөнөөс {count} удаа хоцорсон. Явцаа шинэчилнэ үү.',
    adminCheck: '「{class}」-ын хичээлийн төлөвлөгөөг шалгаад шинэчилнэ үү.',
  },
  th: {
    overdueTitle: 'งานเลยกำหนดส่ง',
    dueSoonTitle: 'ใกล้ถึงกำหนดส่ง',
    overdueBody: '「{task}」เลยกำหนดแล้ว ({date})',
    dueSoonBody: '「{task}」ใกล้ถึงกำหนด ({date})',
    newTaskTitle: 'งานใหม่',
    newTaskBody: '「{task}」ใน{class}',
    submittedTitle: 'นักเรียนส่งงานแล้ว',
    submittedBody: '{name} ส่ง「{task}」แล้ว',
    onlineTitle: 'กำลังเรียนออนไลน์',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'มีคะแนนและความเห็นแล้ว',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'แบบฝึกใหม่',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'ประเมินหลังคาบ',
    sessionEvalBody: 'โปรดประเมินครูหลัง「{session}」 — {class}',
    courseEvalTitle: 'ประเมิน{kind}',
    courseEvalBody: 'โปรดประเมินรายวิชา「{class}」 ({kind})',
    midterm: 'กลางภาค',
    final: 'ปลายภาค',
    adminTitle: 'เตือนความคืบหน้าการสอน',
    adminBehind: '「{class}」ช้ากว่าแผน {count} คาบ โปรดอัปเดตความคืบหน้า',
    adminCheck: 'โปรดตรวจและอัปเดตแผนการสอนของ「{class}」',
  },
  id: {
    overdueTitle: 'Tugas melewati batas',
    dueSoonTitle: 'Pengingat batas waktu',
    overdueBody: '「{task}」 sudah melewati batas ({date})',
    dueSoonBody: '「{task}」 segera jatuh tempo ({date})',
    newTaskTitle: 'Tugas baru',
    newTaskBody: '「{task}」 di {class}',
    submittedTitle: 'Siswa mengumpulkan tugas',
    submittedBody: '{name} mengumpulkan 「{task}」',
    onlineTitle: 'Kelas daring sedang berlangsung',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Nilai dan komentar sudah ada',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'Latihan baru',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Penilaian sesi',
    sessionEvalBody: 'Nilai guru setelah 「{session}」 — {class}',
    courseEvalTitle: 'Penilaian {kind}',
    courseEvalBody: 'Mohon nilai kursus 「{class}」 ({kind})',
    midterm: 'tengah semester',
    final: 'akhir semester',
    adminTitle: 'Pengingat kemajuan mengajar',
    adminBehind: '「{class}」 tertinggal {count} sesi dari rencana. Perbarui kemajuan mengajar.',
    adminCheck: 'Periksa dan perbarui rencana mengajar 「{class}」.',
  },
  fr: {
    overdueTitle: 'Devoir en retard',
    dueSoonTitle: 'Échéance proche',
    overdueBody: '「{task}」 est en retard ({date})',
    dueSoonBody: '「{task}」 arrive bientôt à échéance ({date})',
    newTaskTitle: 'Nouveau devoir',
    newTaskBody: '「{task}」 dans {class}',
    submittedTitle: 'Un élève a rendu un devoir',
    submittedBody: '{name} a rendu 「{task}」',
    onlineTitle: 'Classe en ligne en cours',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Note et commentaire disponibles',
    gradedBody: '「{task}」 : {grade}/{max}',
    practiceTitle: 'Nouvel exercice',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Évaluation de la séance',
    sessionEvalBody: 'Évaluez l’enseignant après 「{session}」 — {class}',
    courseEvalTitle: 'Évaluation {kind}',
    courseEvalBody: 'Évaluez le cours 「{class}」 ({kind})',
    midterm: 'mi-parcours',
    final: 'fin de cours',
    adminTitle: 'Rappel de progression',
    adminBehind: '「{class}」 a {count} séances de retard. Mettez la progression à jour.',
    adminCheck: 'Vérifiez et mettez à jour le plan de 「{class}」.',
  },
  es: {
    overdueTitle: 'Tarea fuera de plazo',
    dueSoonTitle: 'La fecha de entrega se acerca',
    overdueBody: '「{task}」 está fuera de plazo ({date})',
    dueSoonBody: '「{task}」 vence pronto ({date})',
    newTaskTitle: 'Tarea nueva',
    newTaskBody: '「{task}」 en {class}',
    submittedTitle: 'Un alumno entregó la tarea',
    submittedBody: '{name} entregó 「{task}」',
    onlineTitle: 'La clase en línea está en curso',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Ya hay nota y comentario',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'Práctica nueva',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Evaluación de la sesión',
    sessionEvalBody: 'Valora al docente después de 「{session}」 — {class}',
    courseEvalTitle: 'Evaluación de {kind}',
    courseEvalBody: 'Evalúa el curso 「{class}」 ({kind})',
    midterm: 'mitad',
    final: 'final',
    adminTitle: 'Aviso de avance docente',
    adminBehind: '「{class}」 va {count} sesiones por detrás del plan. Actualiza el avance.',
    adminCheck: 'Revisa y actualiza el plan de 「{class}」.',
  },
  de: {
    overdueTitle: 'Abgabe überfällig',
    dueSoonTitle: 'Frist rückt näher',
    overdueBody: '「{task}」 ist überfällig ({date})',
    dueSoonBody: '「{task}」 ist bald fällig ({date})',
    newTaskTitle: 'Neue Aufgabe',
    newTaskBody: '「{task}」 in {class}',
    submittedTitle: 'Eine Schülerin oder ein Schüler hat abgegeben',
    submittedBody: '{name} hat 「{task}」 abgegeben',
    onlineTitle: 'Online-Unterricht läuft',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Note und Rückmeldung sind da',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'Neue Übung',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Bewertung der Stunde',
    sessionEvalBody: 'Bewerten Sie die Lehrkraft nach 「{session}」 — {class}',
    courseEvalTitle: 'Bewertung {kind}',
    courseEvalBody: 'Bewerten Sie den Kurs 「{class}」 ({kind})',
    midterm: 'Zwischenstand',
    final: 'Abschluss',
    adminTitle: 'Hinweis zum Unterrichtsfortschritt',
    adminBehind: '「{class}」 liegt {count} Stunden hinter dem Plan. Bitte den Fortschritt aktualisieren.',
    adminCheck: 'Bitte den Unterrichtsplan von 「{class}」 prüfen und aktualisieren.',
  },
  ru: {
    overdueTitle: 'Срок сдачи прошёл',
    dueSoonTitle: 'Срок сдачи близко',
    overdueBody: '「{task}」 просрочено ({date})',
    dueSoonBody: '「{task}」 скоро нужно сдать ({date})',
    newTaskTitle: 'Новое задание',
    newTaskBody: '「{task}」 в классе {class}',
    submittedTitle: 'Ученик сдал работу',
    submittedBody: '{name} сдал(а) 「{task}」',
    onlineTitle: 'Онлайн-занятие идёт',
    onlineBody: '「{session}」 — {class}',
    gradedTitle: 'Оценка и комментарий готовы',
    gradedBody: '「{task}」: {grade}/{max}',
    practiceTitle: 'Новая практика',
    practiceBody: '「{task}」 — {class}',
    sessionEvalTitle: 'Оценка занятия',
    sessionEvalBody: 'Оцените учителя после 「{session}」 — {class}',
    courseEvalTitle: 'Оценка: {kind}',
    courseEvalBody: 'Оцените курс 「{class}」 ({kind})',
    midterm: 'середина',
    final: 'конец',
    adminTitle: 'Напоминание о ходе преподавания',
    adminBehind: '「{class}」 отстаёт от плана на {count} занятий. Обновите прогресс.',
    adminCheck: 'Проверьте и обновите план 「{class}」.',
  },
}

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

function formatStoredDate(raw: string, locale: Locale) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return raw
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  return date.toLocaleDateString(localeOption(locale).intl, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function localizeText(value: string | null | undefined, locale: Locale): string {
  if (!value) return value ?? ''
  if (locale === 'vi') return value
  const trimmed = value.trim()
  return CONTENT[trimmed]?.[locale] ?? CONTENT[trimmed]?.en ?? value
}

export function localizeEmbedded(value: string, locale: Locale): string {
  if (!value || locale === 'vi') return value
  let next = value
  for (const source of SOURCE_KEYS) {
    if (!next.includes(source)) continue
    const translated = CONTENT[source][locale] ?? CONTENT[source].en ?? source
    next = next.split(source).join(translated)
  }
  return next
}

export function localizeNotice(notice: NoticeLike, locale: Locale): { title: string; message: string } {
  const phrase = PHRASES[locale] ?? PHRASES.en
  const name = (value: string) => localizeText(value, locale)
  const kindName = (value: string) => (value === 'cuối kỳ' ? phrase.final : phrase.midterm)
  const message = notice.message

  if (notice.type === 'deadline_reminder') {
    const match = message.match(/^Bài 「(.+)」 (đã quá hạn|sắp đến hạn) \((.+)\)$/)
    if (match) {
      const overdue = match[2] === 'đã quá hạn'
      const vars = { task: name(match[1]), date: formatStoredDate(match[3], locale) }
      return {
        title: overdue ? phrase.overdueTitle : phrase.dueSoonTitle,
        message: fill(overdue ? phrase.overdueBody : phrase.dueSoonBody, vars),
      }
    }
  }

  if (notice.type === 'new_assignment') {
    const match = message.match(/^「(.+)」 trong lớp (.+)$/)
    if (match) {
      return {
        title: phrase.newTaskTitle,
        message: fill(phrase.newTaskBody, { task: name(match[1]), class: name(match[2]) }),
      }
    }
  }

  if (notice.type === 'submission_received') {
    const match = message.match(/^(.+) đã nộp bài 「(.+)」$/)
    if (match) {
      return {
        title: phrase.submittedTitle,
        message: fill(phrase.submittedBody, { name: match[1], task: name(match[2]) }),
      }
    }
  }

  if (notice.type === 'online_class') {
    const match = message.match(/^「(.+)」 — (.+)$/)
    if (match) {
      return {
        title: phrase.onlineTitle,
        message: fill(phrase.onlineBody, { session: name(match[1]), class: name(match[2]) }),
      }
    }
  }

  if (notice.type === 'feedback') {
    const match = message.match(/^Bài 「(.+)」: (\d+)\/(\d+)$/)
    if (match) {
      return {
        title: phrase.gradedTitle,
        message: fill(phrase.gradedBody, { task: name(match[1]), grade: match[2], max: match[3] }),
      }
    }
  }

  if (notice.type === 'practice_set') {
    const match = message.match(/^「(.+)」 — (.+)$/)
    if (match) {
      return {
        title: phrase.practiceTitle,
        message: fill(phrase.practiceBody, { task: name(match[1]), class: name(match[2]) }),
      }
    }
  }

  if (notice.type === 'session_eval') {
    const match = message.match(/^Hãy đánh giá giáo viên sau buổi 「(.+)」 — (.+)$/)
    if (match) {
      return {
        title: phrase.sessionEvalTitle,
        message: fill(phrase.sessionEvalBody, { session: name(match[1]), class: name(match[2]) }),
      }
    }
  }

  if (notice.type === 'course_eval') {
    const match = message.match(/^Vui lòng đánh giá khoá học 「(.+)」 \((giữa kỳ|cuối kỳ)\)$/)
    if (match) {
      const kind = kindName(match[2])
      return {
        title: fill(phrase.courseEvalTitle, { kind }),
        message: fill(phrase.courseEvalBody, { class: name(match[1]), kind }),
      }
    }
  }

  if (notice.type === 'admin_reminder') {
    const behind = message.match(
      /^Lớp 「(.+)」 đang chậm (\d+) buổi so với kế hoạch\. Vui lòng cập nhật tiến độ giảng dạy\.$/
    )
    if (behind) {
      return {
        title: phrase.adminTitle,
        message: fill(phrase.adminBehind, { class: name(behind[1]), count: behind[2] }),
      }
    }
    const check = message.match(/^Vui lòng kiểm tra và cập nhật kế hoạch giảng dạy lớp 「(.+)」\.$/)
    if (check) {
      return {
        title: phrase.adminTitle,
        message: fill(phrase.adminCheck, { class: name(check[1]) }),
      }
    }
  }

  return {
    title: localizeText(notice.title, locale),
    message: localizeEmbedded(message, locale),
  }
}

type ActivityPhrases = {
  joinTitle: string
  joinBody: string
  updateTitle: string
  updateBody: string
  cancelTitle: string
  cancelBody: string
  cancelledTitle: string
  cancelledBody: string
  archiveTitle: string
  archiveBody: string
  publishTitle: string
  reopenTitle: string
  publishBody: string
  submitTitle: string
  submitBody: string
  submitLateBody: string
  adminCreateTitle: string
  adminCreateBody: string
  assignedTitle: string
  assignedBody: string
}

const ACTIVITY: Record<Locale, ActivityPhrases> = {
  vi: {
    joinTitle: 'Tham gia lớp học',
    joinBody: 'Đã tham gia lớp "{class}" (mã {code})',
    updateTitle: 'Cập nhật lớp học',
    updateBody: 'Đã cập nhật lớp "{from}" → "{to}"',
    cancelTitle: 'Huỷ lớp học',
    cancelBody: 'Đã huỷ lớp "{class}" (mã {code})',
    cancelledTitle: 'Lớp học bị huỷ',
    cancelledBody: 'Lớp "{class}" đã bị giáo viên huỷ',
    archiveTitle: 'Lưu trữ lớp học',
    archiveBody: 'Đã lưu trữ lớp "{class}". Học sinh không thể tham gia mới.',
    publishTitle: 'Phát hành lớp học',
    reopenTitle: 'Mở lại lớp học',
    publishBody: 'Đã phát hành lớp "{class}" (mã {code}). Học sinh có thể tham gia.',
    submitTitle: 'Nộp bài tập',
    submitBody: 'Đã nộp bài "{task}"',
    submitLateBody: 'Đã nộp bài "{task}" (muộn)',
    adminCreateTitle: 'Tạo lớp học (admin)',
    adminCreateBody: 'Đã tạo lớp "{class}" cho GV {name}',
    assignedTitle: 'Được giao lớp học',
    assignedBody: 'Admin đã tạo lớp "{class}" (mã {code}) cho bạn',
  },
  en: {
    joinTitle: 'Joined a class',
    joinBody: 'Joined "{class}" (code {code})',
    updateTitle: 'Class updated',
    updateBody: 'Updated the class from "{from}" to "{to}"',
    cancelTitle: 'Class cancelled',
    cancelBody: 'Cancelled "{class}" (code {code})',
    cancelledTitle: 'Class was cancelled',
    cancelledBody: 'The teacher cancelled "{class}"',
    archiveTitle: 'Class archived',
    archiveBody: 'Archived "{class}". New students can no longer join.',
    publishTitle: 'Class published',
    reopenTitle: 'Class reopened',
    publishBody: 'Published "{class}" (code {code}). Students can join.',
    submitTitle: 'Assignment submitted',
    submitBody: 'Submitted "{task}"',
    submitLateBody: 'Submitted "{task}" (late)',
    adminCreateTitle: 'Class created (admin)',
    adminCreateBody: 'Created "{class}" for teacher {name}',
    assignedTitle: 'Class assigned',
    assignedBody: 'An admin created "{class}" (code {code}) for you',
  },
  ko: {
    joinTitle: '수업에 참여함',
    joinBody: '"{class}"에 참여했습니다 (코드 {code})',
    updateTitle: '수업 정보를 수정함',
    updateBody: '수업 이름을 "{from}"에서 "{to}"(으)로 바꿨습니다',
    cancelTitle: '수업을 취소함',
    cancelBody: '"{class}"을 취소했습니다 (코드 {code})',
    cancelledTitle: '수업이 취소됨',
    cancelledBody: '교사가 "{class}"을 취소했습니다',
    archiveTitle: '수업을 보관함',
    archiveBody: '"{class}"을 보관했습니다. 새 학생은 참여할 수 없습니다.',
    publishTitle: '수업을 게시함',
    reopenTitle: '수업을 다시 염',
    publishBody: '"{class}"을 게시했습니다 (코드 {code}). 학생이 참여할 수 있습니다.',
    submitTitle: '과제를 제출함',
    submitBody: '"{task}"을 제출했습니다',
    submitLateBody: '"{task}"을 늦게 제출했습니다',
    adminCreateTitle: '수업을 만듦 (관리자)',
    adminCreateBody: '교사 {name}을 위해 "{class}"을 만들었습니다',
    assignedTitle: '수업을 배정받음',
    assignedBody: '관리자가 "{class}"을 만들었습니다 (코드 {code})',
  },
  ja: {
    joinTitle: 'クラスに参加',
    joinBody: '「{class}」に参加しました（コード {code}）',
    updateTitle: 'クラスを更新',
    updateBody: 'クラス名を「{from}」から「{to}」に変更しました',
    cancelTitle: 'クラスを中止',
    cancelBody: '「{class}」を中止しました（コード {code}）',
    cancelledTitle: 'クラスが中止されました',
    cancelledBody: '教員が「{class}」を中止しました',
    archiveTitle: 'クラスを保管',
    archiveBody: '「{class}」を保管しました。新しい生徒は参加できません。',
    publishTitle: 'クラスを公開',
    reopenTitle: 'クラスを再開',
    publishBody: '「{class}」を公開しました（コード {code}）。生徒が参加できます。',
    submitTitle: '課題を提出',
    submitBody: '「{task}」を提出しました',
    submitLateBody: '「{task}」を遅れて提出しました',
    adminCreateTitle: 'クラスを作成（管理者）',
    adminCreateBody: '教員 {name} のために「{class}」を作成しました',
    assignedTitle: 'クラスが割り当てられました',
    assignedBody: '管理者が「{class}」を作成しました（コード {code}）',
  },
  'zh-Hans': {
    joinTitle: '加入班级',
    joinBody: '已加入「{class}」（代码 {code}）',
    updateTitle: '更新班级',
    updateBody: '已将班级从「{from}」改为「{to}」',
    cancelTitle: '取消班级',
    cancelBody: '已取消「{class}」（代码 {code}）',
    cancelledTitle: '班级已取消',
    cancelledBody: '教师已取消「{class}」',
    archiveTitle: '归档班级',
    archiveBody: '已归档「{class}」。新学生不能再加入。',
    publishTitle: '发布班级',
    reopenTitle: '重新开放班级',
    publishBody: '已发布「{class}」（代码 {code}）。学生可以加入。',
    submitTitle: '提交作业',
    submitBody: '已提交「{task}」',
    submitLateBody: '已迟交「{task}」',
    adminCreateTitle: '创建班级（管理员）',
    adminCreateBody: '已为教师 {name} 创建「{class}」',
    assignedTitle: '班级已分配',
    assignedBody: '管理员已为你创建「{class}」（代码 {code}）',
  },
  'zh-Hant': {
    joinTitle: '加入班級',
    joinBody: '已加入「{class}」（代碼 {code}）',
    updateTitle: '更新班級',
    updateBody: '已將班級從「{from}」改為「{to}」',
    cancelTitle: '取消班級',
    cancelBody: '已取消「{class}」（代碼 {code}）',
    cancelledTitle: '班級已取消',
    cancelledBody: '教師已取消「{class}」',
    archiveTitle: '歸檔班級',
    archiveBody: '已歸檔「{class}」。新學生不能再加入。',
    publishTitle: '發布班級',
    reopenTitle: '重新開放班級',
    publishBody: '已發布「{class}」（代碼 {code}）。學生可以加入。',
    submitTitle: '提交作業',
    submitBody: '已提交「{task}」',
    submitLateBody: '已遲交「{task}」',
    adminCreateTitle: '建立班級（管理員）',
    adminCreateBody: '已為教師 {name} 建立「{class}」',
    assignedTitle: '班級已分配',
    assignedBody: '管理員已為你建立「{class}」（代碼 {code}）',
  },
  lzh: {
    joinTitle: '入班',
    joinBody: '已入「{class}」（碼 {code}）',
    updateTitle: '改班',
    updateBody: '班名自「{from}」改為「{to}」',
    cancelTitle: '廢班',
    cancelBody: '已廢「{class}」（碼 {code}）',
    cancelledTitle: '班已廢',
    cancelledBody: '師已廢「{class}」',
    archiveTitle: '庋班',
    archiveBody: '已庋「{class}」。新生徒不得入。',
    publishTitle: '頒班',
    reopenTitle: '復班',
    publishBody: '已頒「{class}」（碼 {code}）。生徒可入。',
    submitTitle: '納作業',
    submitBody: '已納「{task}」',
    submitLateBody: '遲納「{task}」',
    adminCreateTitle: '立班（掌事）',
    adminCreateBody: '為師 {name} 立「{class}」',
    assignedTitle: '受班',
    assignedBody: '掌事為汝立「{class}」（碼 {code}）',
  },
  mn: {
    joinTitle: 'Ангид элссэн',
    joinBody: '"{class}"-д элслээ (код {code})',
    updateTitle: 'Ангийг шинэчилсэн',
    updateBody: 'Ангийн нэрийг "{from}"-оос "{to}" болголоо',
    cancelTitle: 'Ангийг цуцалсан',
    cancelBody: '"{class}"-ыг цуцаллаа (код {code})',
    cancelledTitle: 'Анги цуцлагдсан',
    cancelledBody: 'Багш "{class}"-ыг цуцаллаа',
    archiveTitle: 'Ангийг архивласан',
    archiveBody: '"{class}"-ыг архивлалаа. Шинэ сурагч элсэх боломжгүй.',
    publishTitle: 'Ангийг нийтэлсэн',
    reopenTitle: 'Ангийг дахин нээсэн',
    publishBody: '"{class}"-ыг нийтэллээ (код {code}). Сурагчид элсэж болно.',
    submitTitle: 'Даалгавар илгээсэн',
    submitBody: '"{task}"-ыг илгээлээ',
    submitLateBody: '"{task}"-ыг хоцорч илгээлээ',
    adminCreateTitle: 'Анги үүсгэсэн (админ)',
    adminCreateBody: 'Багш {name}-д "{class}" үүсгэлээ',
    assignedTitle: 'Анги оноогдсон',
    assignedBody: 'Админ танд "{class}" үүсгэлээ (код {code})',
  },
  th: {
    joinTitle: 'เข้าร่วมชั้นเรียน',
    joinBody: 'เข้าร่วม "{class}" แล้ว (รหัส {code})',
    updateTitle: 'อัปเดตชั้นเรียน',
    updateBody: 'เปลี่ยนชื่อชั้นจาก "{from}" เป็น "{to}"',
    cancelTitle: 'ยกเลิกชั้นเรียน',
    cancelBody: 'ยกเลิก "{class}" แล้ว (รหัส {code})',
    cancelledTitle: 'ชั้นเรียนถูกยกเลิก',
    cancelledBody: 'ครูยกเลิก "{class}" แล้ว',
    archiveTitle: 'เก็บชั้นเรียน',
    archiveBody: 'เก็บ "{class}" แล้ว นักเรียนใหม่เข้าร่วมไม่ได้',
    publishTitle: 'เผยแพร่ชั้นเรียน',
    reopenTitle: 'เปิดชั้นเรียนอีกครั้ง',
    publishBody: 'เผยแพร่ "{class}" แล้ว (รหัส {code}) นักเรียนเข้าร่วมได้',
    submitTitle: 'ส่งงาน',
    submitBody: 'ส่ง "{task}" แล้ว',
    submitLateBody: 'ส่ง "{task}" ช้า',
    adminCreateTitle: 'สร้างชั้นเรียน (ผู้ดูแล)',
    adminCreateBody: 'สร้าง "{class}" ให้ครู {name}',
    assignedTitle: 'ได้รับชั้นเรียน',
    assignedBody: 'ผู้ดูแลสร้าง "{class}" ให้คุณ (รหัส {code})',
  },
  id: {
    joinTitle: 'Bergabung ke kelas',
    joinBody: 'Bergabung ke "{class}" (kode {code})',
    updateTitle: 'Kelas diperbarui',
    updateBody: 'Nama kelas diubah dari "{from}" menjadi "{to}"',
    cancelTitle: 'Kelas dibatalkan',
    cancelBody: 'Membatalkan "{class}" (kode {code})',
    cancelledTitle: 'Kelas dibatalkan',
    cancelledBody: 'Guru membatalkan "{class}"',
    archiveTitle: 'Kelas diarsipkan',
    archiveBody: 'Mengarsipkan "{class}". Siswa baru tidak bisa bergabung.',
    publishTitle: 'Kelas diterbitkan',
    reopenTitle: 'Kelas dibuka kembali',
    publishBody: 'Menerbitkan "{class}" (kode {code}). Siswa dapat bergabung.',
    submitTitle: 'Tugas dikumpulkan',
    submitBody: 'Mengumpulkan "{task}"',
    submitLateBody: 'Mengumpulkan "{task}" (terlambat)',
    adminCreateTitle: 'Kelas dibuat (admin)',
    adminCreateBody: 'Membuat "{class}" untuk guru {name}',
    assignedTitle: 'Kelas diberikan',
    assignedBody: 'Admin membuat "{class}" (kode {code}) untuk Anda',
  },
  fr: {
    joinTitle: 'Classe rejointe',
    joinBody: 'A rejoint « {class} » (code {code})',
    updateTitle: 'Classe mise à jour',
    updateBody: 'Nom changé de « {from} » à « {to} »',
    cancelTitle: 'Classe annulée',
    cancelBody: 'A annulé « {class} » (code {code})',
    cancelledTitle: 'Classe annulée',
    cancelledBody: 'L’enseignant a annulé « {class} »',
    archiveTitle: 'Classe archivée',
    archiveBody: 'A archivé « {class} ». Les nouveaux élèves ne peuvent plus rejoindre.',
    publishTitle: 'Classe publiée',
    reopenTitle: 'Classe rouverte',
    publishBody: 'A publié « {class} » (code {code}). Les élèves peuvent rejoindre.',
    submitTitle: 'Devoir rendu',
    submitBody: 'A rendu « {task} »',
    submitLateBody: 'A rendu « {task} » (en retard)',
    adminCreateTitle: 'Classe créée (admin)',
    adminCreateBody: 'A créé « {class} » pour {name}',
    assignedTitle: 'Classe attribuée',
    assignedBody: 'Un admin a créé « {class} » (code {code}) pour vous',
  },
  es: {
    joinTitle: 'Te uniste a la clase',
    joinBody: 'Te uniste a "{class}" (código {code})',
    updateTitle: 'Clase actualizada',
    updateBody: 'El nombre pasó de "{from}" a "{to}"',
    cancelTitle: 'Clase cancelada',
    cancelBody: 'Se canceló "{class}" (código {code})',
    cancelledTitle: 'La clase fue cancelada',
    cancelledBody: 'El docente canceló "{class}"',
    archiveTitle: 'Clase archivada',
    archiveBody: 'Se archivó "{class}". Los alumnos nuevos ya no pueden unirse.',
    publishTitle: 'Clase publicada',
    reopenTitle: 'Clase reabierta',
    publishBody: 'Se publicó "{class}" (código {code}). Los alumnos pueden unirse.',
    submitTitle: 'Tarea entregada',
    submitBody: 'Entregaste "{task}"',
    submitLateBody: 'Entregaste "{task}" (tarde)',
    adminCreateTitle: 'Clase creada (admin)',
    adminCreateBody: 'Se creó "{class}" para {name}',
    assignedTitle: 'Clase asignada',
    assignedBody: 'Un admin creó "{class}" (código {code}) para ti',
  },
  de: {
    joinTitle: 'Klasse beigetreten',
    joinBody: '„{class}“ beigetreten (Code {code})',
    updateTitle: 'Klasse aktualisiert',
    updateBody: 'Name von „{from}“ zu „{to}“ geändert',
    cancelTitle: 'Klasse abgesagt',
    cancelBody: '„{class}“ abgesagt (Code {code})',
    cancelledTitle: 'Klasse wurde abgesagt',
    cancelledBody: 'Die Lehrkraft hat „{class}“ abgesagt',
    archiveTitle: 'Klasse archiviert',
    archiveBody: '„{class}“ archiviert. Neue Schüler können nicht mehr beitreten.',
    publishTitle: 'Klasse veröffentlicht',
    reopenTitle: 'Klasse wieder geöffnet',
    publishBody: '„{class}“ veröffentlicht (Code {code}). Schüler können beitreten.',
    submitTitle: 'Aufgabe abgegeben',
    submitBody: '„{task}“ abgegeben',
    submitLateBody: '„{task}“ verspätet abgegeben',
    adminCreateTitle: 'Klasse erstellt (Admin)',
    adminCreateBody: '„{class}“ für {name} erstellt',
    assignedTitle: 'Klasse zugewiesen',
    assignedBody: 'Ein Admin hat „{class}“ (Code {code}) für Sie erstellt',
  },
  ru: {
    joinTitle: 'Вступление в класс',
    joinBody: 'Вы вступили в «{class}» (код {code})',
    updateTitle: 'Класс обновлён',
    updateBody: 'Название изменено с «{from}» на «{to}»',
    cancelTitle: 'Класс отменён',
    cancelBody: 'Класс «{class}» отменён (код {code})',
    cancelledTitle: 'Класс отменён',
    cancelledBody: 'Учитель отменил «{class}»',
    archiveTitle: 'Класс в архиве',
    archiveBody: '«{class}» в архиве. Новые ученики не могут вступить.',
    publishTitle: 'Класс опубликован',
    reopenTitle: 'Класс снова открыт',
    publishBody: '«{class}» опубликован (код {code}). Ученики могут вступить.',
    submitTitle: 'Работа сдана',
    submitBody: 'Сдано «{task}»',
    submitLateBody: 'Сдано «{task}» (с опозданием)',
    adminCreateTitle: 'Класс создан (админ)',
    adminCreateBody: 'Создан класс «{class}» для {name}',
    assignedTitle: 'Класс назначен',
    assignedBody: 'Админ создал для вас «{class}» (код {code})',
  },
}

export function localizeActivity(
  item: { title: string; message: string },
  locale: Locale
): { title: string; message: string } {
  if (locale === 'vi') return { title: item.title, message: item.message }
  const phrase = ACTIVITY[locale] ?? ACTIVITY.en
  const name = (value: string) => localizeText(value, locale)
  const message = item.message

  const join = message.match(/^Đã tham gia lớp "(.+)" \(mã (.+)\)$/)
  if (join) {
    return { title: phrase.joinTitle, message: fill(phrase.joinBody, { class: name(join[1]), code: join[2] }) }
  }
  const update = message.match(/^Đã cập nhật lớp "(.+)" → "(.+)"$/)
  if (update) {
    return {
      title: phrase.updateTitle,
      message: fill(phrase.updateBody, { from: name(update[1]), to: name(update[2]) }),
    }
  }
  const cancel = message.match(/^Đã huỷ lớp "(.+)" \(mã (.+)\)$/)
  if (cancel) {
    return { title: phrase.cancelTitle, message: fill(phrase.cancelBody, { class: name(cancel[1]), code: cancel[2] }) }
  }
  const cancelled = message.match(/^Lớp "(.+)" đã bị giáo viên huỷ$/)
  if (cancelled) {
    return { title: phrase.cancelledTitle, message: fill(phrase.cancelledBody, { class: name(cancelled[1]) }) }
  }
  const archive = message.match(/^Đã lưu trữ lớp "(.+)"\. Học sinh không thể tham gia mới\.$/)
  if (archive) {
    return { title: phrase.archiveTitle, message: fill(phrase.archiveBody, { class: name(archive[1]) }) }
  }
  const publish = message.match(/^Đã phát hành lớp "(.+)" \(mã (.+)\)\. Học sinh có thể tham gia\.$/)
  if (publish) {
    return {
      title: item.title === 'Mở lại lớp học' ? phrase.reopenTitle : phrase.publishTitle,
      message: fill(phrase.publishBody, { class: name(publish[1]), code: publish[2] }),
    }
  }
  const late = message.match(/^Đã nộp bài "(.+)" \(muộn\)$/)
  if (late) {
    return { title: phrase.submitTitle, message: fill(phrase.submitLateBody, { task: name(late[1]) }) }
  }
  const submitted = message.match(/^Đã nộp bài "(.+)"$/)
  if (submitted) {
    return { title: phrase.submitTitle, message: fill(phrase.submitBody, { task: name(submitted[1]) }) }
  }
  const created = message.match(/^Đã tạo lớp "(.+)" cho GV (.+)$/)
  if (created) {
    return {
      title: phrase.adminCreateTitle,
      message: fill(phrase.adminCreateBody, { class: name(created[1]), name: created[2] }),
    }
  }
  const assigned = message.match(/^Admin đã tạo lớp "(.+)" \(mã (.+)\) cho bạn$/)
  if (assigned) {
    return {
      title: phrase.assignedTitle,
      message: fill(phrase.assignedBody, { class: name(assigned[1]), code: assigned[2] }),
    }
  }

  return {
    title: localizeText(item.title, locale),
    message: localizeEmbedded(message, locale),
  }
}
