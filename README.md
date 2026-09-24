# Administracion-Parrilla - Sistema de Administración de Salón

Sistema web de gestión integral para parrillas y restaurantes, desarrollado con **React + Vite + Supabase**. Permite administrar mesas, reservas, mozos, pedidos y stock, con generación automática de tickets térmicos, control de estados en tiempo real y autenticación mediante **Magic Links**.

🔗 **Demo:** (próximamente)

---

## ✨ Características principales

* 🪑 **Gestión completa de mesas** – 47 mesas con estados dinámicos: disponible, ocupada y reservada.
* 📅 **Sistema de reservas** – Asignación de reservas a mesas con nombre del cliente, completadas automáticamente al cobrar.
* 👨‍🍳 **Asignación de mozos** – Cada mesa puede tener un mozo asignado, visible en la interfaz y en el ticket.
* 🍽️ **Gestión de pedidos por mesa** – Carga de consumos con control de cantidades, edición de pedidos y cálculo automático del total.
* ✏️ **Edición de pedidos en curso** – Modificación de cantidades de productos ya agregados sin perder el pedido.
* 🧾 **Tickets térmicos 58mm** – Generación automática en PDF optimizado para impresora térmica Global TP-POS58-USB.
* 📄 **Factura A4** – Generación de factura completa en formato A4 con datos del cliente y detalle de consumos.
* 📊 **Base de datos de productos** – Menú categorizado (Menús, Minutas, Bebidas, Postres, Vinos) con precios editables.
* 🗑️ **Cancelación de pedidos** – Cancelación con restauración automática del estado de la mesa.
* 🔐 **Autenticación con Magic Links** – Inicio de sesión sin contraseñas mediante Supabase Auth.
* 🛡️ **Row Level Security (RLS)** – Políticas de seguridad a nivel de fila en todas las tablas.
* 📱 **Mobile First** – Diseño optimizado para tablets y móviles, ideal para uso en salón.
* 🎨 **UI con glassmorphism** – Interfaz moderna con efectos de vidrio, gradientes y animaciones fluidas.
* ⚡ **Enrutamiento completo** – Navegación fluida con React Router DOM y HashRouter.

---

## 🛠️ Stack Tecnológico

| Tecnología              | Uso                                       |
| ----------------------- | ----------------------------------------- |
| React 19                | UI y componentes                          |
| Vite                    | Build tool y desarrollo                   |
| React Router DOM        | Enrutamiento de la aplicación             |
| Supabase                | Base de datos PostgreSQL y autenticación  |
| PostgreSQL              | Base de datos relacional                  |
| jsPDF                   | Generación de PDFs (facturas y tickets)   |
| jspdf-autotable         | Tablas dentro de los PDFs                 |
| Magic Links             | Autenticación sin contraseña              |
| Row Level Security      | Seguridad a nivel de fila                 |
| CSS3                    | Estilos, glassmorphism y responsive       |
| Netlify                 | Hosting y despliegue continuo             |

---

## 📊 Base de Datos

PostgreSQL mediante **Supabase**, utilizando **7 tablas relacionales** y **Row Level Security (RLS)** para garantizar que solo usuarios autenticados puedan acceder a la información.

| Tabla            | Propósito                                                |
| ---------------- | -------------------------------------------------------- |
| reservas         | Reservas activas, completadas y canceladas               |
| mozos            | Listado de mozos activos del salón                       |
| productos        | Menú completo con categorías y precios                   |
| categorias       | Agrupación de productos (Menús, Vinos, Postres, etc.)    |
| pedidos          | Cabecera de cada pedido (mesa, total, estado)            |
| detalle_pedido   | Items individuales de cada pedido                        |

> 📌 **Nota:** Los estados de las mesas se manejan en el frontend y se sincronizan con la base de datos a través de reservas y pedidos activos.

---

## 🚀 Flujo del Sistema

### 🍽️ Flujo de un pedido

```text
Usuario selecciona una mesa
        ↓
Se abre la vista completa de la mesa
        ↓
Carga productos al pedido (con cantidades)
        ↓
Guarda y sigue comiendo → vuelve a la grilla
        ↓
Cobra y libera → genera ticket PDF y libera la mesa
```

### 📅 Flujo de una reserva

```text
Usuario selecciona una mesa disponible
        ↓
Ingresa el nombre del cliente
        ↓
Se guarda la reserva en Supabase
        ↓
La mesa cambia a estado "reservada"
        ↓
Al cobrar el pedido → la reserva se completa automáticamente
        ↓
La mesa vuelve a estar disponible
```

### 👨‍🍳 Flujo de asignación de mozo

```text
Usuario abre la vista de una mesa
        ↓
Click en "Asignar Mozo"
        ↓
Selecciona un mozo de la lista
        ↓
El mozo queda asignado a la mesa
        ↓
El nombre del mozo aparece en el ticket PDF
```

### 🔐 Autenticación mediante Magic Links

```text
Usuario ingresa su email
        ↓
Supabase Auth genera un Magic Link
        ↓
Envía el enlace de acceso por email
        ↓
El usuario abre el enlace
        ↓
Se verifica el token y se crea la sesión
        ↓
Redirección automática al dashboard
```

---

## 📂 Estructura del Proyecto

```text
/
├── src/
│   ├── components/
│   │   ├── MenuPrincipal/     # Menú de módulos
│   │   ├── Mesas/             # Componentes de mesas
│   │   │   ├── GrillaMesas.jsx
│   │   │   ├── MesaCard.jsx
│   │   │   ├── FormularioReservaSimple.jsx
│   │   │   └── SelectorMozo.jsx
│   │   └── LogoutButton.jsx
│   ├── context/               # Contexto global (RestauranteContext)
│   ├── pages/                 # Páginas de la aplicación
│   │   ├── Dashboard.jsx
│   │   ├── MesaView.jsx
│   │   ├── login.jsx
│   │   └── AuthCallback.jsx
│   ├── services/              # Lógica de PDFs y servicios
│   │   └── pdfService.js
│   ├── lib/                   # Cliente de Supabase
│   ├── styles/                # Arquitectura CSS
│   └── App.jsx
├── public/
│   └── _redirects             # Redirecciones para Netlify
├── package.json
└── netlify.toml
```

---

## 🎯 Módulos del Sistema

### 1. 🪑 Módulo de Mesas

* Grilla visual con estados por color (verde, rojo, amarillo).
* Vista completa por mesa con menú, pedido actual y acciones.
* Redirección fluida entre grilla y vista de mesa.

### 2. 📅 Módulo de Reservas

* Reserva desde la vista de la mesa.
* Estados: pendiente, confirmada, completada, cancelada.
* Completado automático al cobrar el pedido.

### 3. 👨‍🍳 Módulo de Mozos

* Listado de mozos activos.
* Asignación y cambio de mozo por mesa.
* Visualización en el header y en el ticket.

### 4. 🍽️ Módulo de Pedidos

* Carga de productos con botones +/−.
* Edición de pedidos ya guardados.
* Cálculo automático del total.
* Fusión automática de productos repetidos.

### 5. 🧾 Módulo de Facturación

* Ticket térmico 58mm (impresora Global TP-POS58-USB).
* Factura A4 completa.
* Datos del cliente, mozo y detalle de productos.

### 6. 📦 Módulo de Stock (en desarrollo)

* Base de datos de productos editable.
* Categorización por tipo.
* Actualización de precios.

---

## 📱 Capturas de Pantalla

> *(Próximamente)*

---

## 🚧 Roadmap

- [ ] Módulo completo de carga de mercadería.
- [ ] Reportes de ventas diarios, semanales y mensuales.
- [ ] Historial de pedidos por mesa.
- [ ] Múltiples turnos (almuerzo / cena).
- [ ] Exportación de reportes a Excel.
- [ ] Integración con balanzas e impresoras fiscales.
- [ ] Notificaciones push para mozos.
- [ ] Modo offline con sincronización.

---

## 📖 Referencias bibliográficas

**El gran libro de HTML5, CSS3 y Javascript**  
**Juan Diego Gauchat**  
Guía completa sobre las tecnologías fundamentales del desarrollo web moderno.

**Eloquent JavaScript (JavaScript Elocuente)**  
**Marijn Haverbeke**  
Libro moderno y práctico que cubre desde fundamentos hasta temas avanzados del lenguaje. Disponible gratuitamente en línea, con enfoque en código claro y eficiente.

---

## 📝 Licencia

Proyecto desarrollado con fines educativos y de portafolio.

---

## 👨‍💻 Autor

Desarrollado por **Franco De Vincentis**  
🔗 [GitHub] : https://github.com/franco497 · [LinkedIn] : https://www.linkedin.com/in/franco-de-vincentis/