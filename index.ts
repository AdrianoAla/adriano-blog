import ejs from 'ejs'
import path from 'path'
import { Database } from "bun:sqlite";

type Article = {
    id: number;
    title:string;
    timestamp:string;
    content:string;
}

const db = new Database('database.db')

const server = Bun.serve({

    routes: {
        "/": async () => {

            const query = db.query("SELECT * FROM articles ORDER BY id DESC");
            let articles: Article[] = query.all();

            const index_file_path = path.join(import.meta.dir, 'views', 'index.ejs');
            const html = await ejs.renderFile(index_file_path, { articles: articles });

            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        },

        "/post/:id": async (req) => {
            const post_id = req.params.id;

            const query = db.query("select * from articles where id="+post_id);

            if (query.all().length == 0) {
                return new Response("Not Found", { status: 404 });
            }

            const selected_article = query.get()


            const blog_file_path = path.join(import.meta.dir, 'views', 'blog.ejs')
            const markdown_html = Bun.markdown.html(selected_article.content)

            selected_article.markdown_html = markdown_html

            const html = await ejs.renderFile(blog_file_path, { article: selected_article });

            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }


    },

    async fetch(req) {
        const url = new URL(req.url);

        const staticDir = new URL("./static/", import.meta.url);

        const fileUrl = new URL(
            "." + decodeURIComponent(url.pathname.replace(/^\/static/, "")),
            staticDir,
        );

        if (!fileUrl.href.startsWith(staticDir.href)) {
            return new Response("Forbidden", { status: 403 });
        }

        const file = Bun.file(fileUrl);

        if (await file.exists()) {
            return new Response(file);
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running at ${server.url}`);
