const SUPABASE_URL="https://atoxxxxalqvksreuyulk.supabase.co"
const SUPABASE_ANON_KEY="sb_publishable_gNPZD80qWrkvFprpTzKEMw_3WRh_Em-"


const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function renderView(templateId, viewId, data) {
    let source = document.querySelector(`#${templateId}`).innerHTML;

    let template = Handlebars.compile(source);

    document.querySelector(`#${viewId}`).innerHTML =
        template({ data });
}

function getSelectedCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "All";
}

function highlightCategoryTab(categoryId) {
    const allLinks = document.querySelectorAll("#categories a");
    allLinks.forEach(link => {
        const url = new URL(link.href);
        const cat = url.searchParams.get("category");
        if (categoryId === "All" && !cat) {
            link.classList.add("active");
        } else if (cat === String(categoryId)) {
            link.classList.add("active");
        }
    });
}

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
            category:categories!information_category_id_fkey!inner(id, name, type),
            comments:comments!comments_blogId_fkey(id)
        `, { count: "exact" })
        .eq("category.type", "blogs")
        .order("created_at", { ascending: false });

    if (!Number.isNaN(safeCategoryId) && safeCategoryId > 0) {
        query = query.eq("category_id", safeCategoryId);
    }

    const { data, error, count } = await query.range(from, to);
    const totalItems = count ?? 0;
    const pageCount = Math.ceil(totalItems / safePageSize);
    const prevPage = Math.max(1, safePage - 1 );
    const nextPage = Math.min(pageCount, safePage + 1 );

    if (error) {
        console.error(error);
        return {
            data: [],
            pagination: {
                currentPage: safePage,
                pageCount: 0,
                category: categoryId,
                size: 2,
                prevPage,
                nextPage
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
            prevPage: prevPage,
            nextPage: nextPage,
        },
        error,
    };
}

Handlebars.registerHelper("pagination", function (currentPage, pageCount, size, options) {
    const pages = [];
    for (let i = 1; i <= pageCount; i++) {
        pages.push({
            page: i,
            isCurrent: i === currentPage,
        });
    }

    const context = {
        pages,
        prevPage: Math.max(1, currentPage - 1),
        nextPage: Math.min(pageCount, currentPage + 1),
        startFromFirstPage: currentPage === 1,
        endAtLastPage: currentPage === pageCount,
        category: this.category,
    };

    return options.fn(context);
});

async function sendMessage(name, email, subject, message) {
    const { error } = await client.from('contacts').insert({ 
        name, 
        email, 
        subject, 
        message 
    });
    if (error) throw error;
}

function handleLogoutButton() {
    document.querySelectorAll(".logout-btn").forEach((btn) => {
        btn.onclick = async () => {
            try {
                await supabaseLogout();
            } catch (error) {
                alert(`Logout Error: ${error.message}`);
            }
        };
    });
}









(async function initPage() {
    handleLogoutButton();
})();

