import { getProp, ac, rc, since } from 'ljsy';

export const wp = {
    type: '',
    perPage: 6,
    loadedPosts: 0,
    flattened: {},
    wpJsonUrl: 'https://public-api.wordpress.com/wp/v2/sites/kraft6.home.blog/',

    listen(callback) {
        this.callback = callback;
    },

    request(url) {
        ac(['loading', this.type]);
        return fetch(url).then(res => res.json()).then(json => {
            if (this.type === 'posts' && !json.length) {
                this.loadedPosts = 0;
                return this.getPosts();
            }
            this.callback(this.flatten(json));
            rc(['loading', this.type]);
        });
    },

    async getPosts(count) {
        this.type = 'posts';
        if (count) this.perPage = count;
        await this.request(`${this.wpJsonUrl}posts?offset=${this.loadedPosts}&per_page=${this.perPage}&_embed`);
        this.loadedPosts += this.perPage;
    },

    getSinglePost(post_id) {
        this.type = 'singlePost';
        this.request(`${this.wpJsonUrl}posts/${post_id}?_embed`);
    },

    getPage(page_id) {
        this.type = 'page';
        this.request(`${this.wpJsonUrl}pages/${page_id}?_embed`);
    },

    getFirstImage(content) {
        let el = document.createElement('html');
        el.innerHTML = content;
        const image = (el.querySelector('img') || {}).src;
        el = undefined;
        return image;
    },

    fixMarkup(content) {
        let el = document.createElement('html');
        el.innerHTML = content;
        const figures = el.querySelectorAll('figure');
        figures.forEach(fig => {
            if (fig.parentElement.nodeName === 'P') {
                fig.parentElement.parentElement.insertBefore(fig, fig.parentElement);
                fig.parentElement.remove();
            }
        });
        const fixedHTML = el.innerHTML;
        el = undefined;
        return fixedHTML;
    },

    flatten(original) {
        const json = Array.isArray(original) ? original : [ original ];

        return {
            type: this.type,
            items: json.map(o => {

                // remove props
                Object.keys(o).forEach(k => {
                    /jetpack|meta|featured_media|comment_status|ping_status|sticky|template|format|gmt|status|categories|tags/.test(k) && (delete o[k]);
                    /guid|title|content|excerpt/.test(k) && o[k] && (o[k] = o[k].rendered);
                });

                const featuredMedia = getProp(o, 'jetpack_featured_media_url')
                    || getProp(o, '_embedded.wp:featuredmedia.0.media_details.sizes.full.source_url');

                featuredMedia && (o.features = true);

                // move and simplify embedded props
                o.image = (featuredMedia || this.getFirstImage(o.content) || '/assets/placeholder.jpg') + '?w=300';
                o.author = getProp(o, '_embedded.author.0');
                o.since = since(o.modified);

                const props = ['categories', 'tags'];
                Object.assign(o, getProp(o, '_embedded.wp:term').reduce((terms, arr) => {
                    const type = props.shift();
                    terms[type] = arr.map(({ name, link }) => ({ name, link, type }));
                    return terms;
                }, {}));

                // fix markup
                o.content = this.fixMarkup(o.content);

                // remove embedded props
                delete o._embedded;
                delete o._links;

                return o;
            })
        };
    }

};
