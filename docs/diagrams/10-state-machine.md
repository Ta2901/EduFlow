# Sơ đồ trạng thái (State Machine Diagram)

## Tài khoản `User.accountStatus`

```mermaid
stateDiagram-v2
  [*] --> pending : đăng ký
  pending --> active : admin approve
  active --> restricted : admin hạn chế
  active --> suspended : admin đình chỉ
  restricted --> active : gỡ hạn chế
  restricted --> suspended : đình chỉ
  suspended --> active : khôi phục
  pending --> [*] : không bao giờ login
  suspended --> [*] : login bị chặn
```

## Buổi học `OnlineSession.status`

```mermaid
stateDiagram-v2
  [*] --> scheduled : createOnlineSession
  scheduled --> live : action start
  live --> ended : action end
  ended --> [*]
  note right of ended
    Kích hoạt notifySessionEvalOpen
  end note
```

## Kế hoạch `TeachingPlanItem.status`

```mermaid
stateDiagram-v2
  [*] --> planned
  planned --> done : GV hoàn thành
  planned --> skipped : GV bỏ qua
  done --> planned : sửa lại khi lưu kế hoạch giữ index
  skipped --> planned : sửa lại
```

## Đánh giá khoá `CourseEvaluation.status`

```mermaid
stateDiagram-v2
  [*] --> draft : tạo placeholder
  draft --> open : GV/Admin mở
  open --> closed : đóng
  closed --> open : mở lại
  open --> draft : đặt lại nháp
```

## Bài nộp `Submission.status`

```mermaid
stateDiagram-v2
  [*] --> not_submitted
  not_submitted --> submitted : nộp đúng hạn
  not_submitted --> late : nộp sau dueDate
  submitted --> submitted : nộp lại
  late --> late : nộp lại
```
