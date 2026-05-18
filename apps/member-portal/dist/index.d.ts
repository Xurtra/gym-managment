export declare const memberPortalRoutes: readonly [{
    readonly path: "/login";
    readonly title: "Member Login";
    readonly protected: false;
}, {
    readonly path: "/";
    readonly title: "Member Home";
    readonly protected: true;
}, {
    readonly path: "/classes";
    readonly title: "Classes";
    readonly protected: true;
}, {
    readonly path: "/billing";
    readonly title: "Billing";
    readonly protected: true;
}, {
    readonly path: "/check-in";
    readonly title: "Check-In Code";
    readonly protected: true;
}];
export declare function buildMemberPortalLayout(path: string): import("@gym-platform/ui").LayoutModel;
//# sourceMappingURL=index.d.ts.map