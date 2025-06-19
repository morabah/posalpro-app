# Priority 1: Admin Panel Data Integration Plan

**Objective**: Achieve full-stack vertical integration for the Admin panel by
replacing all mock data with live, database-driven data, making the user and
role management features fully operational.

---

### **Strategy**

The strategy is to connect the fully-featured Admin UI component (`AdminSystem`)
to the verified backend APIs (`/api/admin/users`, `/api/admin/roles`) via the
existing data hooks (`useUsers`, `useRoles`). This will complete the data flow
(Database -> API -> Hooks -> UI), enabling full CRUD functionality and providing
a clear pattern for future feature integration.

---

### **Tactics & Implementation Steps**

#### **Phase 1: Analysis & Verification (Complete)**

1.  **[✅] API Route Verification:**

    - **Action**: Inspected the source code for `/api/admin/users/route.ts` and
      `/api/admin/roles/route.ts`.
    - **Result**: Confirmed both routes implement full CRUD functionality with
      pagination, filtering, and Zod validation. The backend is
      production-ready.

2.  **[✅] Data Hook Verification:**
    - **Action**: Inspected the source code for
      `src/hooks/admin/useAdminData.ts`.
    - **Result**: Confirmed the `useUsers` and `useRoles` hooks are fully
      implemented. They handle state management (loading, error, data) and
      include functions for all necessary CRUD operations, which automatically
      refetch data upon completion.

#### **Phase 2: UI Integration (Implementation)**

1.  **Refactor `AdminSystem` Component:**

    - **File**: `src/app/(dashboard)/admin/page.tsx`
    - **Action 1**: Remove the `MOCK_ROLES` constant array. It is no longer
      needed.
    - **Action 2**: In the `Role Management` tab, replace the direct usage of
      `MOCK_ROLES` with the `roles` data returned from the `useRoles` hook.
    - **Action 3**: Wire the `loading` state from the `useUsers` and `useRoles`
      hooks to display skeleton loaders or spinners, providing clear visual
      feedback to the user.
    - **Action 4**: Wire the `error` state from the hooks to display toast
      notifications or error messages, informing the user of any issues.

2.  **Enable Full CRUD Interactivity:**

    - **File**: `src/app/(dashboard)/admin/page.tsx`
    - **Action 1 (Create)**: Connect the `[+ New User]` and `[+ New Role]`
      buttons to modal forms that, upon submission, call the `createUser` and
      `createRole` functions from the respective hooks.
    - **Action 2 (Update)**: Connect the "edit" functionality for each row in
      the users and roles tables to modal forms that call the `updateUser` and
      `updateRole` functions.
    - **Action 3 (Delete)**: Connect the "delete" functionality to a
      confirmation dialog that calls the `deleteUser` and `deleteRole`
      functions.

3.  **Create Plan Documentation:**
    - **File**: `docs/PRIORITY_1_INTEGRATION_PLAN.md`
    - **Action**: This document has been created to track the strategy and
      execution of this priority task.

---

### **Success Criteria**

- All mock data is removed from the Admin panel.
- The user and role management tables are populated with data directly from the
  database.
- Administrators can successfully create, read, update, and delete users and
  roles from the UI.
- The UI provides clear loading and error feedback to the user during all data
  operations.
- The task is considered complete when the Admin panel is fully data-driven and
  functional.
