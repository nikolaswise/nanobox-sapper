// This file is generated by Sapper — do not edit it!
import _ from '../../routes/index.html';
import book_club from '../../routes/book-club/index.html';
import portfolio from '../../routes/portfolio.html';
import contact from '../../routes/contact.html';
import about from '../../routes/about.html';
import news from '../../routes/news/index.html';
import _4xx from '../../routes/4xx.html';
import _5xx from '../../routes/5xx.html';

export const routes = [
	{ id: '_', type: 'page', pattern: /^\/?$/, params: () => ({}), module: _ },
	{ id: 'book_club', type: 'page', pattern: /^\/book-club\/?$/, params: () => ({}), module: book_club },
	{ id: 'portfolio', type: 'page', pattern: /^\/portfolio\/?$/, params: () => ({}), module: portfolio },
	{ id: 'contact', type: 'page', pattern: /^\/contact\/?$/, params: () => ({}), module: contact },
	{ id: 'about', type: 'page', pattern: /^\/about\/?$/, params: () => ({}), module: about },
	{ id: 'news', type: 'page', pattern: /^\/news\/?$/, params: () => ({}), module: news },
	{ error: '4xx', module: _4xx },
	{ error: '5xx', module: _5xx }
];