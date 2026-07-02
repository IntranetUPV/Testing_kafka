const logins = []

function enqueueLoginEvent(event) {
    logins.unshift(event);
}
function getLoginEvents() {
    return logins;
}
export { enqueueLoginEvent, getLoginEvents }