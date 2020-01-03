import './scss/index.scss';
import { qs, create, ac,rc } from 'ljsy';
import { wp } from './wp';
import icons from './icons';

const root = qs('#root');

const _sections = {};

const templates = {
    posts: items => items.map(o => `
        <article data-id="${o.id}">
            <div class="image" style="background-image:url(${o.image});"></div>
            <h3>${o.title}</h3>
            <!--<p>${o.excerpt}</p>-->
            <footer>
                <div class="byline"><time>${o.since} siden</time></div>
            </footer>
        </article>
    `).join(''),

    singlePost: items => items.map(o => `
        <article data-id="${o.id}" data-link="${o.link}">
            <div class="image" style="background-image:url(${o.image.replace(/\?.*$/, '')});">
                <h3>${o.title}</h3>
                <footer>
                    <div class="byline"><span class="author">${o.author.name}</span><time>${o.since} siden</time></div>
                </footer>
            </div>
            <p>${o.content}</p>
            <aside>
                <dl>${o.categories.concat(o.tags).map(l => `<dd class="${l.type}"><a href="${l.link}">${l.name}</a></dd>`).join('')}</dl>
            </aside>
        </article>
    `).join('')
};

const handlers = {
    header: () => {
        _sections.singlePost.innerHTML = '';
        rc('minimize', _sections.header);
        window.scrollTo(0, 0);
    },
    posts: dataset => {
        wp.getSinglePost(dataset.id);
        ac('minimize', _sections.header);
        window.scrollTo(0, 0);
    },
    loadMore: () => {
        wp.getPosts().then(() => {
            scrollTo(0, _sections.posts.offsetTop - 20);
        });
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

createSection('overlay', 'Laster...');
createSection('header', `
    <div class="fixed top">Beskrivende tekst her</div>
    <div class="logo"><h1>KRAFT</h1>${icons('logoShape')}</div>
    <div class="fixed bottom">${icons('chevronDown')}Les magasin</div>
`);
createSection('singlePost');
createSection('posts');
createSection('loadMore', '<button>Last flere saker</button>');

ac('initial-load');

wp.listen(({ type, items }) => {
    const container = _sections[type] || createSection(type);
    requestAnimationFrame(() => {
        items.length && (container.innerHTML = templates[type](items));
        rc('initial-load');
    });
});

wp.getPosts(6);

(function resetScroll() {
    scrollTo(0, 0);
    window.onbeforeunload = resetScroll;
})();