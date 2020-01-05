import { getProp, ac, rc, since } from 'ljsy';
import { imageSizes } from './config';

export const wp = {
    apiHost: undefined,
    type: undefined,
    perPage: 6,
    loadedPosts: 0,

    listen(apiHost, callback) {
        this.apiHost = apiHost;
        this.callback = callback;
    },

    request(url, type) {
        ac(['loading', type]);
        return fetch(url).then(res => res.json()).then(json => {
            if (type === 'posts' && !json.length) {
                this.loadedPosts = 0;
                return this.getPosts();
            }
            this.callback(this.flatten(json, type));
            rc(['loading', type]);
        });
    },

    async getPosts(count) {
        if (count) this.perPage = count;
        await this.request(
            `${this.apiHost}posts?offset=${this.loadedPosts}&per_page=${this.perPage}&_embed`,
            'posts'
        );
        this.loadedPosts += this.perPage;
    },
    
    async getCategory(category) {
        await this.request(`${this.apiHost}posts?offset=${this.loadedPosts}&per_page=${this.perPage}&_embed&category=${category}`, 'posts')
        this.loadedPosts += this.perPage;
    },    

    getSinglePost(post_id) {
        this.request(`${this.apiHost}posts/${post_id}?_embed`, 'singlePost');
    },

    getPage(page_id) {
        this.request(`${this.apiHost}pages/${page_id}?_embed`, 'singlePost');
    },

    getCategories() {
        this.request(`${this.apiHost}categories`, 'categories');
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

    flatten(response, type) {
        const json = Array.isArray(response) ? response : [ response ];

        if (type === 'categories') {
            return {
                type,
                items: json.map(({ name, link, id }) => ({ name, link, id, type }))
            };
        }

        return {
            type,
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
                o.image = (featuredMedia || this.getFirstImage(o.content) || '/assets/placeholder.jpg') + '?w=' + imageSizes.medium;
                o.author = getProp(o, '_embedded.author.0');
                o.since = since(o.modified);

                const props = ['categories', 'tags'];
                Object.assign(o, (getProp(o, '_embedded.wp:term') || []).reduce((terms, arr) => {
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
