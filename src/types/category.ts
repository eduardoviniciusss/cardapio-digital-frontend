// Corpo retornado por GET /categories e GET /categories/{id}
export interface Category {
  id: number
  name: string
  schoolId: number
}

// Corpo enviado em POST /categories e PUT /categories/{id}
// (o backend só usa "name" no PUT, mas "schoolId" faz parte do CategoryDto
// e não tem problema mandar sempre os dois campos)
export interface CategoryPayload {
  name: string
  schoolId: number
}