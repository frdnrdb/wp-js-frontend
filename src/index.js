import './scss/index.scss';
import Siema from 'siema';
import { wp } from './wp';
import { API_HOST } from './config';
import { isDesktop, qs, qsa, create, ac, rc, tc } from 'ljsy';
import icons from './icons';

const root = qs('#root');
isDesktop && ac('desktop', root);
const _sections = {};

const templates = {
    posts: items => items.map(o => `
        <article data-id="${o.id}">
            <div class="image" style="background-image:url(${o.image});"></div>
            <h3>${o.title}</h3>
            <p>${o.excerpt}</p>
            <footer>
                <div class="byline"><time>${o.since} siden</time></div>
            </footer>
        </article>
    `).join(''),

    singlePost: items => items.map(o => `
        <article data-id="${o.id}" data-link="${o.link}">
            <div class="image ${o.type}" style="background-image:url(${o.image.replace(/\?.*$/, '')});">
                <h3>${o.title}</h3>
                <footer>
                    <div class="byline"><span class="author">${o.author.name}</span><time>${o.since} siden</time></div>
                </footer>
            </div>
            <p>${o.content}</p>
            <aside>
                <dl>${o.terms.map(l => `<dd class="${l.type}"><a href="${l.link}">${l.name}</a></dd>`).join('')}</dl>
            </aside>
        </article>
    `).join(''),

    categories: items => `<span data-menu="1">MENY</span><div>${items.map(o => `
        <div data-id="${o.id}" data-type="${o.type}">
            ${o.name}
        </div>
    `).join('')}</div>`
};

const toggleHeader = on => {
    document.body.classList[on ? 'add' : 'remove']('sticky-header');
    window.scrollTo(0, 0);    
}

const handlers = {
    header: () => {
        _sections.singlePost.innerHTML = '';
        location.hash = '';
        toggleHeader();
    },
    posts: dataset => {
        wp.getSinglePost(dataset.id);
        location.hash = `id=${dataset.id}`;
        toggleHeader(true);
    },
    loadMore: () => {
        wp.getPosts().then(() => {
            scrollTo(0, _sections.posts.offsetTop - 100);
        });
    },
    categories: dataset => {
        tc('active', _sections.categories);

        if (dataset.type === 'page') {
            toggleHeader(true);
            return wp.getPage(dataset.id);
        }

        if (dataset.id) {
            wp.getCategory(dataset.id).then(() => {
                _sections.singlePost.innerHTML = '';
                location.hash = '';
                scrollTo(0, _sections.posts.offsetTop - 100);
            });
        }
    }
};

const createSection = (type, innerHTML = '') =>  _sections[type] = create('section', root, {
    className: `section-${type}`,
    innerHTML,
    on: {
        click: e => {
            handlers[type] && handlers[type](e.target.dataset);
        }
    }
});

const buildGallery = (container, i) => {
    const id = `gallery-${i}`;
    container.id = id;
    new Siema({ selector: `#${id}` });
};

createSection('overlay', 'Laster...');
createSection('header', `
    <div class="fixed topleft">${icons('logo')}</div>
    <!--<div class="fixed top">Beskrivende tekst her</div>-->
    <div class="logo"><h1>KRAFT</h1></div>
    <!--<div class="fixed bottom">${icons('chevronDown')}Les magasin</div>-->
`);
createSection('categories', '`<span>MENY</span>');
createSection('singlePost');
createSection('posts');
createSection('loadMore', '<button>Last flere saker</button>');

ac('initial-load');

wp.listen(API_HOST, ({ type, items }) => {
    const container = _sections[type] || createSection(type);
    requestAnimationFrame(() => {
        if (type === 'categories') {
            items.push(
                {
                    name: 'Om oss',
                    type: 'page',
                    id: 703
                }             
            );
        }
                
        templates[type] && (container.innerHTML = templates[type](items));

        if (type === 'singlePost') {
            qsa(['.gallery']).forEach(buildGallery);
        }

        rc('initial-load');
    });
});

wp.getCategories();
wp.getPosts().then(() => {
    const [, id] = location.hash.match(/id=(\d+)/) || [];
    id && handlers.posts({ id });
});

(function resetScroll() {
    scrollTo(0, 0);
    window.onbeforeunload = resetScroll;
})();