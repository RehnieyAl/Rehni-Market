ROLES_PERMISSIONS_ROUTERS = {
    "admin": [
        "/admin/dashboard/statistics",
        "/admin/dashboard/recent-activities",
        "/admin/dashboard/recent-users",
        "/admin/dashboard/get-companies",
        "/admin/dashboard/get-company/",
        "/admin/dashboard/companies/certificate/status/",
        "/admin/dashboard/company/status/",
        "/admin/dashboard/get-users",
        "/admin/dashboard/user/update-information/",
        "/admin/dashboard/user/update-information/status/",
        "/admin/dashboard/user/delete/",
        "/auth/me",
    ],

    "company": [
        "/company/dashboard/me",
        "/company/dashboard/my-profile",
        "/company/dashboard/upgrade-my-profile",
        "/company/dashboard/patch-media-logo-banner",
        "/company/dashboard/create-product",
        "/company/dashboard/get-my-products",
        "/company/dashboard/change-status-my-product/",
        "/company/dashboard/delete-my-product/",
        "/company/dashboard/update-my-product/",
        "/auth/me",
    ],

    "user": [
        "/auth/me",
    ],
}