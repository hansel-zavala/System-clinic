import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Si está definido, solo esos roles pueden entrar a la ruta. */
    roles?: import('../domain/types').UserRole[]
  }
}
