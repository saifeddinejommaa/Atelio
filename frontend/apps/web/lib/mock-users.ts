// Comptes de démonstration, en attendant l'authentification de l'API .NET.
export type MockUser = { email: string; password: string; name: string; phone: string };

export const mockUsers: MockUser[] = [
  { email: "test@test.com", password: "0000", name: "Jean Test", phone: "06 12 34 56 78" },
];

export function findMockUser(email: string, password: string) {
  return mockUsers.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
}

export function findMockUserByEmail(email: string) {
  return mockUsers.find((u) => u.email === email);
}
