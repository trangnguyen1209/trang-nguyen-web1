async function fetchDataByTypes(types = ["products"]) {
  const { data, error } = await client
    .from("information")
    .select(
        `
            *,
            categories:information_category_id_fkey!inner(type)
        `,
    )
    .in("categories.type", types);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map(({ categories, ...info }) => ({
    ...info,
    type: categories?.type ?? null,
  }));
}


async function fetchDataById(id) {
  const { data, error } = await client
    .from("information")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}


async function subscribe(email) {
  const { error } = await client.from('subscriptions').insert({ email });
  if (error) throw error;
}

async function fetchTestimonials() {
    const { data, error } = await client.from("testimonials").select(`
        *,
        user:users!testimonials_author_id_fkey(*)
    `);

    if (error) {
        console.error(error);
        return [];
    }

    return (data ?? []).map(({ user, ...info }) => ({
        ...info,
        name: user?.name ?? "Anonymous",
        email: user?.email ?? null,
    }));
}

async function fetchCategoriesByType(type = "gallery") {
    const { data, error } = await client
        .from("categories")
        .select()
        .eq("type", type);

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

async function fetchGallery() {
    return fetchDataByTypes(["gallery"]);
}


async function fetchBlogsByCategoryId(categoryId = "All", page = 1, pageSize = 2) {
    const safeCategoryId = Number(categoryId);
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 2);

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    // Bước 1: lấy tất cả category_id có type = "blogs"
    const { data: blogCategories } = await client
        .from("categories")
        .select("id")
        .eq("type", "blogs");

    const blogCategoryIds = (blogCategories ?? []).map(c => c.id);

    // Bước 2: query blogs theo category_id
    let query = client
        .from("information")
        .select(`
            id,
            title,
            category_id,
            author_id,
            thumbpath,
            summary,
            created_at,
            author:users!information_author_id_fkey(id, name),
            category:categories!information_category_id_fkey(id, name, type),
            comments:comments!comments_blogId_fkey(id)
        `, { count: "exact" })
        .in("category_id", blogCategoryIds)
        .order("created_at", { ascending: false });

    if (!Number.isNaN(safeCategoryId) && safeCategoryId > 0) {
        query = query.eq("category_id", safeCategoryId);
    }

    const { data, error, count } = await query.range(from, to);
    const totalItems = count ?? 0;
    const pageCount = Math.ceil(totalItems / safePageSize);
    const prevPage = Math.max(1, safePage - 1);
    const nextPage = Math.min(pageCount, safePage + 1);

    if (error) {
        console.error(error);
        return {
            data: [],
            pagination: {
                currentPage: safePage,
                pageCount: 0,
                category: categoryId,
                size: safePageSize,
                prevPage,
                nextPage,
            },
            error,
        };
    }

    return {
        data,
        pagination: {
            currentPage: safePage,
            pageCount,
            category: categoryId,
            size: safePageSize,
            prevPage,
            nextPage,
        },
        error,
    };
}

async function fetchBlogById(id) {
    const { data, error } = await client
        .from("information")
        .select(`
            id,
            title,
            category_id,
            author_id,
            imagepath,
            description,
            created_at,
            author:users!information_author_id_fkey(id, name),
            category:categories!information_category_id_fkey!inner(id, name),
            comments:comments!comments_blogId_fkey(
                id,
                message,
                created_at,
                author:users!comments_authorId_fkey(id, name)
            )
        `)
        .eq("id", id)
        .order("created_at", { ascending: false, foreignTable: "comments" })
        .single();

    if (error) {
        console.error("Error fetching blog details", error);
        return null;
    }

    return data;
}