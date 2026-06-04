export const parsePagination = (pageRaw, pageSizeRaw) => {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize
    };
};
