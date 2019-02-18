import Turbolinks from 'turbolinks';
import ReactDOM from 'react-dom';
import React from 'react';
import '@babel/polyfill';
import 'activestorage';
import 'styles/event';
import 'vendor/styleguide.js';
import 'vendor/turbo-react.min.js';
import { render as timeagoRender } from 'timeago.js';
import './rails-ujs-extends';

Turbolinks.start();
Turbolinks.setProgressBarDelay(150);

window.$ = jQuery;

const metaLocale = document.querySelector('meta[name=locale]');
window.App = {
  // en, zh_CN
  locale: (metaLocale && metaLocale.content || 'en').replace('-', '_'),
};

document.addEventListener('turbolinks:load', () => {
  timeagoRender(document.querySelectorAll('.timeago'), App.locale);
});

import './reader/index.js';
import './versions/index.js';
import './follow-user/index.js';
import './comments/index.js';
import './mentionable/index.js';
import './toc-editor/index.js';