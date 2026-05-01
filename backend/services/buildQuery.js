export function buildUserQuery(data) {
  return `
    Student with ${data.qualification}
    wants to study ${data.field}
    in ${data.countryIds?.join(", ")}
    with budget ${data.budget}
    starting in ${data.intake}
    goal is ${data.goal}
  `;
}