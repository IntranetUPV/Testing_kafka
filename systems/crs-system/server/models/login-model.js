const students = {};
let login = null;

function getLoginAccount() {
    return login;
}

function setLoginAccount(account) {
    login = account;
}

function addSubject(studentId, subject) {
    if (!students[studentId]) {
        students[studentId] = { subjects: [subject] };
    } else {
        students[studentId].subjects.push(subject);
    }
    return students[studentId].subjects;
}

function removeSubject(studentId, subjectId) {
    if (!students[studentId] || !Array.isArray(students[studentId].subjects)) {
        return false;
    }
    const originalLength = students[studentId].subjects.length;
    students[studentId].subjects = students[studentId].subjects.filter((subject) => subject.id !== subjectId);
    return students[studentId].subjects.length < originalLength;
}

function getStudentSubjects(studentId) {
    return students[studentId]?.subjects ?? [];
}

export { setLoginAccount, getLoginAccount, addSubject, removeSubject, getStudentSubjects }
