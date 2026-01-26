# CollegeDash Teacher App - API Documentation

Base URL: `https://multi-prod-api.studyaid.in/api`

All endpoints require Bearer token authentication via the `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Batch APIs](#batch-apis)
2. [Course APIs](#course-apis)
3. [Class & Section APIs](#class--section-apis)
4. [Subject APIs](#subject-apis)
5. [Student APIs](#student-apis)
6. [E-Content APIs](#e-content-apis)
7. [Attendance APIs](#attendance-apis)
8. [Homework/Assignment APIs](#homeworkassignment-apis)

---

## Batch APIs

### Get All Batches

```
GET /v1/batch
```

**Response:** `ApiResponseListBatch`

```json
{
  "status": "string",
  "timeStamp": "string",
  "message": "string",
  "responseObject": [
    {
      "_id": "string",
      "name": "string",
      "startDate": "string",
      "endDate": "string",
      "institutionId": "string",
      "isActive": true
    }
  ]
}
```

### Create Batch

```
POST /v1/batch
```

**Request Body:**

```json
{
  "name": "string",
  "startDate": "string",
  "endDate": "string",
  "institutionId": "string"
}
```

### Update Batch

```
PUT /v1/batch
```

**Request Body:** Same as Create Batch

### Update Batch Fees for Class

```
PUT /v1/admin/batch/class/fees/create
```

**Query Parameters:**

| Parameter       | Type   | Required | Description          |
| --------------- | ------ | -------- | -------------------- |
| `institutionId` | string | Yes      | Institution ID       |
| `newBatchId`    | string | Yes      | New batch ID         |
| `classId`       | string | Yes      | Class ID             |
| `section`       | string | Yes      | Section name         |

---

## Course APIs

### Get Courses by Batch

```
GET /v1/course/batch/{batchId}
```

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `batchId` | string | Yes      | Batch ID    |

**Response:**

```json
{
  "status": "string",
  "responseObject": [
    {
      "_id": "string",
      "name": "string",
      "code": "string",
      "description": "string"
    }
  ]
}
```

### Get Course Years

```
GET /v1/course/{courseId}/years
```

**Path Parameters:**

| Parameter  | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `courseId` | string | Yes      | Course ID   |

**Response:**

```json
{
  "status": "string",
  "responseObject": [
    {
      "_id": "string",
      "name": "string",
      "year": 1
    }
  ]
}
```

### Create/Update Course

```
POST /v1/course
PUT /v1/course
```

**Request Body:** `CourseRequest`

```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "institutionId": "string"
}
```

### Update Year in Course

```
PUT /v1/course/{courseId}/year/{yearName}
```

**Path Parameters:**

| Parameter  | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `courseId` | string | Yes      | Course ID   |
| `yearName` | string | Yes      | Year name   |

**Request Body:** `YearRequest`

### Delete Year from Course

```
DELETE /v1/course/{courseId}/year/{yearName}
```

### Add Subject to Course Year

```
PUT /v1/course/{courseId}/year/{yearName}/subject
```

**Request Body:** `AddYearSubjectRequest`

### Update/Delete Subject in Year

```
PUT /v1/course/{courseId}/year/{yearName}/subject/{subjectId}
DELETE /v1/course/{courseId}/year/{yearName}/subject/{subjectId}
```

### Update/Delete Section in Year

```
PUT /v1/course/{courseId}/year/{yearName}/section/{sectionName}
DELETE /v1/course/{courseId}/year/{yearName}/section/{sectionName}
```

---

## Class & Section APIs

### Create Class

```
POST /v1/class
```

**Request Body:** `ClassRequest`

```json
{
  "name": "string",
  "institutionId": "string",
  "batchId": "string"
}
```

### Update Class

```
PUT /v1/class
```

**Request Body:** `ClassRequest`

### Add Subject to Class

```
PUT /v1/class/subject
```

**Request Body:** `AddSubjectRequest`

### Add/Remove Teacher to Subject

```
PUT /v1/class/subject/teacher
DELETE /v1/class/subject/teacher
```

**Request Body:** `AddTeacherSectionRequest` / `DeleteTeacherSectionRequest`

### Add Class Teacher

```
PUT /v1/class/section/teacher
```

**Request Body:** `AddClassTeacherRequest`

### Section Management

```
POST /v1/section   # Add section
PUT /v1/section    # Edit section
DELETE /v1/section # Remove section
```

**Request Body:** `SectionRequest`

```json
{
  "classId": "string",
  "name": "string"
}
```

---

## Subject APIs

### Get All Subjects

```
GET /v1/subject
```

**Query Parameters:**

| Parameter       | Type   | Required | Description    |
| --------------- | ------ | -------- | -------------- |
| `institutionId` | string | Yes      | Institution ID |

**Response:** `ApiResponseListSubject`

### Create Subject

```
POST /v1/subject
```

**Request Body:**

```json
{
  "name": "string",
  "code": "string",
  "institutionId": "string"
}
```

### Update Subject

```
PUT /v1/subject
```

### Get Subjects by Course and Year

```
GET /v1/subject/course/{course-id}/year/{year}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| `course-id` | string | Yes      | Course ID   |
| `year`      | string | Yes      | Year name   |

**Query Parameters:**

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `section` | string | No       | Section name |

**Response:** `ApiResponseSetClassSubject`

### Update Course Subjects

```
PUT /v1/subject/course/{course-id}/year/{year}
```

**Request Body:** Array of `ClassSubject` objects

### Update Class Subjects

```
PUT /v1/subject/class
```

**Query Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `classId` | string | Yes      | Class ID    |

**Request Body:** Array of `ClassSubject` objects

### Add Subject to Batch

```
PUT /v1/subject/batch
```

**Request Body:** `AddSubjectToBatch`

---

## Student APIs

### Get Students by Class/Section (Roll Profile)

```
GET /v1/student/batch/roll/profile
```

**Query Parameters:**

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `batchId` | string | Yes      | Batch ID     |
| `classId` | string | Yes      | Class ID     |
| `section` | string | Yes      | Section name |

**Response:** `ApiResponseListStudentRollProfile`

```json
{
  "responseObject": [
    {
      "studentId": "string",
      "name": "string",
      "rollNumber": "string",
      "profileImage": "string"
    }
  ]
}
```

### Update Student Roll Profiles

```
PUT /v1/student/batch/roll/profile
```

**Request Body:** Array of `StudentRollProfile` objects

### Get Student Facility

```
GET /v1/student/batch/facility
```

**Query Parameters:** Same as Roll Profile

**Response:** `ApiResponseListStudentFacility`

### Update Student Facility

```
PUT /v1/student/batch/facility
```

**Request Body:** Array of `UpdateStudentFacilityRequest` objects

### Activate/Deactivate Student

```
PUT /v1/activate/student
```

**Request Body:** `ActivateDeactivateRequest`

---

## E-Content APIs

### Get All Content

```
GET /v1/teacher/content
```

**Query Parameters:**

| Parameter   | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| `classId`   | string | No       | Filter by class   |
| `section`   | string | No       | Filter by section |
| `subject`   | string | No       | Filter by subject |
| `courseId`  | string | No       | Filter by course  |
| `year`      | string | No       | Filter by year    |
| `subjectId` | string | No       | Filter by subject |

**Response:** `ApiResponseListSubjectContent`

```json
{
  "responseObject": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "string",
      "fileUrl": "string",
      "mimeType": "string",
      "published": true,
      "createdAt": "string"
    }
  ]
}
```

### Create Content

```
POST /v1/teacher/content
```

**Request Body:** `SubjectContent`

```json
{
  "title": "string",
  "description": "string",
  "classId": "string",
  "section": "string",
  "subjectId": "string",
  "chapterId": "string",
  "sectionId": "string",
  "type": "string",
  "fileUrl": "string"
}
```

### Update Content

```
PUT /v1/teacher/content
```

**Request Body:** `SubjectContent`

### Publish Content

```
PUT /v1/teacher/content/{id}/publish
```

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Content ID  |

### Unpublish Content

```
PUT /v1/teacher/content/{id}/unpublish
```

### Move Content

```
PUT /v1/teacher/content/{id}/move
```

**Request Body:** `MoveContentRequest`

### Reorder Content

```
PUT /v1/teacher/content/reorder
```

**Request Body:** `ReorderContentRequest`

### Chapter Management

```
GET /v1/teacher/chapters/{id}
PUT /v1/teacher/chapters/{id}
DELETE /v1/teacher/chapters/{id}
PUT /v1/teacher/chapters/{id}/publish
PUT /v1/teacher/chapters/{id}/unpublish
PUT /v1/teacher/chapters/reorder
```

### Section Management (Content Sections)

```
GET /v1/teacher/sections/{id}
PUT /v1/teacher/sections/{id}
DELETE /v1/teacher/sections/{id}
PUT /v1/teacher/sections/{id}/publish
PUT /v1/teacher/sections/{id}/unpublish
PUT /v1/teacher/sections/{id}/move
PUT /v1/teacher/sections/reorder
```

---

## Attendance APIs

### Student Attendance (Teacher)

#### Save Attendance

```
POST /v1/teacher/attendance
```

**Request Body:** `Attendance`

```json
{
  "institutionId": "string",
  "batchId": "string",
  "classId": "string",
  "section": "string",
  "date": "2024-01-15",
  "students": [
    {
      "studentId": "string",
      "status": "PRESENT|ABSENT|LATE|HALF_DAY",
      "remarks": "string"
    }
  ]
}
```

**Response:** `ApiResponseBoolean`

#### Update Attendance

```
PUT /v1/teacher/attendance
```

**Request Body:** `Attendance` (same as above)

### General Attendance

```
POST /v1/attendance
PUT /v1/attendance
```

**Request Body:** `Attendance`
**Response:** `ApiResponseAttendance`

### Staff/Self Attendance

#### Save Staff Attendance

```
POST /v1/staff/attendance
```

**Request Body:** `StaffAttendance`

```json
{
  "institutionId": "string",
  "staffId": "string",
  "date": "2024-01-15",
  "status": "PRESENT|ABSENT|LATE",
  "checkInTime": "09:00:00",
  "checkOutTime": "17:00:00",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "remarks": "string"
}
```

**Response:** `ApiResponseStaffAttendance`

#### Update Staff Attendance List

```
PUT /v1/staff/attendance
```

**Request Body:** Array of `StaffAttendance` objects
**Response:** `ApiResponseBoolean`

### Attendance Remarks (Report Card)

#### Get Attendance Remarks

```
GET /v1/exams/me/student/attendance/remarks
```

**Query Parameters:**

| Parameter  | Type     | Required | Description       |
| ---------- | -------- | -------- | ----------------- |
| `pageable` | Pageable | Yes      | Pagination params |

#### Get Student Attendance for Bulk Update

```
GET /v1/exams/me/student/attendance/remarks/students
```

**Query Parameters:**

| Parameter       | Type   | Required | Description    |
| --------------- | ------ | -------- | -------------- |
| `institutionId` | string | Yes      | Institution ID |
| `batchId`       | string | Yes      | Batch ID       |
| `classId`       | string | Yes      | Class ID       |
| `section`       | string | Yes      | Section name   |
| `termId`        | string | Yes      | Term ID        |

#### Update Class Working Days

```
PUT /v1/exams/me/student/attendance/remarks/students
```

**Query Parameters:**

| Parameter       | Type    | Required | Description        |
| --------------- | ------- | -------- | ------------------ |
| `institutionId` | string  | Yes      | Institution ID     |
| `batchId`       | string  | Yes      | Batch ID           |
| `classId`       | string  | Yes      | Class ID           |
| `section`       | string  | Yes      | Section name       |
| `termId`        | string  | Yes      | Term ID            |
| `totalDays`     | integer | Yes      | Total working days |

#### Create Bulk Attendance Records

```
POST /v1/exams/me/student/attendance/remarks/students
```

**Request Body:** Array of `StudentAttendanceRemarks`

---

## Homework/Assignment APIs

### Get Day's Homework

```
GET /v1/teacher/homework
```

**Query Parameters:**

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `classId` | string | Yes      | Class ID                 |
| `section` | string | Yes      | Section name             |
| `subject` | string | Yes      | Subject name             |
| `date`    | date   | No       | Date (format YYYY-MM-DD) |

**Response:** `ApiResponseHomework`

```json
{
  "responseObject": {
    "id": "string",
    "classId": "string",
    "section": "string",
    "subject": "string",
    "date": "2024-01-15",
    "description": "string",
    "attachments": ["string"],
    "published": true,
    "dueDate": "2024-01-20"
  }
}
```

### Create Homework

```
POST /v1/teacher/homework
```

**Request Body:** `AddSubjectHomeworkRequest`

```json
{
  "classId": "string",
  "section": "string",
  "subject": "string",
  "subjectId": "string",
  "date": "2024-01-15",
  "description": "string",
  "attachments": ["string"],
  "dueDate": "2024-01-20"
}
```

### Update Homework

```
PUT /v1/teacher/homework
```

**Request Body:** `AddSubjectHomeworkRequest`

### Publish Homework

```
PUT /v1/teacher/homework/publish
```

**Query Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `hwId`    | string | Yes      | Homework ID |

---

## Common Response Structure

All API responses follow this structure:

```json
{
  "status": "SUCCESS|FAILURE",
  "timeStamp": "2024-01-15T10:30:00Z",
  "message": "string",
  "debugMessage": "string",
  "apiResponseStatus": "string",
  "responseObject": {}
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | Success               |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 500         | Internal Server Error |

---

## Notes

1. **Authentication**: All endpoints require Bearer token in the Authorization header
2. **Batch ID**: Most operations require a valid batch ID context
3. **Institution ID**: Available from user's profile data after login
4. **Geo-location**: Staff attendance supports latitude/longitude for location-based check-in
5. **Date Format**: Use ISO 8601 format (YYYY-MM-DD) for date fields
