/* eslint-disable  react/prop-types */

import React from 'react';
import Loader from './Loader';
import Sidebar from './Sidebar';
import Base from './ContentView/Base';
import router from './utils/router';
import parseAttrs from './utils/parse-attrs';
import setupBespoke from './setup-bespoke';

class AppContainer extends React.Component {
  constructor(props) {
    super(props);

    console.log(location.hash);
    this.state = {
      loaded: false, // only use presenter mode
      opened: false, // TODO: refactor to `status: {}`
      loader: true,
      slideInfo: {
        total: 0,
        index: location.hash.slice(1) || 0,
        current: '0' // string
      }
    };

    this.slides = [];
    this.contents = [];
    this.setupBespokeFlag = false; // for lazy load

    props.slides.forEach((slide) => {
      const meta = parseAttrs(slide);

      this.slides.push({
        meta,
        context: slide
      });

      if (meta.contents.length !== 0) {
        this.contents = meta.contents;
      }
    });

    const mode = router();

    if (mode === 'view') {
      import(/* webpackChunkName: 'presenter.view' */ './ContentView/View').then((e) => {
        this.content = e.default;
        this.setState({ loaded: true });
        this.setupBespokeFlag = true;
        this.changeLoaderState();
      });
    } else if (mode === 'host') {
      import(/* webpackChunkName: 'presenter.host' */ './ContentView/Host').then((e) => {
        this.content = e.default;
        this.setState({ loaded: true });
        this.setupBespokeFlag = true;
        this.changeLoaderState();
      });
    } else {
      this.changeLoaderState();
    }
  }

  componentDidMount() {
    if (router() === 'common') {
      this.setupBespoke();
      import('./setup-prism'); // other types(presenter mode: host, view) require lazy loading
    }

    setTimeout(() => {
      const index = window.slide.bespoke.slide() + 1;

      this.setState({
        slideInfo: {
          total: `${this.slides.length}`.padStart(2, '0'),
          index,
          current: `${index}`.padStart(2, '0')
        }
      });

      window.slide.bespoke.on('activate', () => {
        const index = window.slide.bespoke.slide() + 1;

        this.setState({
          slideInfo: {
            ...this.state.slideInfo,
            index,
            current: `${index}`.padStart(2, '0')
          }
        });
      });
    }, 5000);
  }

  UNSAFE_componentWillUpdate() {
    if (this.setupBespokeFlag) {
      this.setupBespoke();
      this.setupBespokeFlag = false;
    }
  }

  changeLoaderState = () => {
    // eslint-disable-line react/sort-comp
    window.onload = () => {
      setTimeout(() => this.setState({ loader: false }), 500);
    };
  };

  goTo = (num) => {
    // eslint-disable-line react/sort-comp
    window.slide.bespoke.slide(num);
  };

  onSetSidebarOpen = (opened) => {
    this.setState({ opened });
  };

  setupBespoke = () => {
    // hmmm.... I have no idea
    // because DOM tree must be built when calling setupBespoke.
    window.slide = {};
    window.slide.bespoke = setupBespoke(this.props.theme);
  };

  getContent = () => {
    return (
      <React.Fragment>
        <Loader displayed={this.state.loader} />
        {this.content ? (
          <this.content slides={this.slides} loadedBespoke={!this.state.loader} />
        ) : (
          <Base slides={this.slides} currentIndex={this.state.slideInfo.index} />
        ) /* for common */}
      </React.Fragment>
    );
  };

  render() {
    return process.env.SIDEBAR ? (
      <Sidebar
        goTo={this.goTo}
        opened={this.state.opened}
        contents={this.contents}
        onSetOpen={this.onSetSidebarOpen}
        slideInfo={this.state.slideInfo}
      >
        {this.getContent()}
        <i
          style={{ width: 50 }}
          className="btn-sidebar fa fa-bars"
          onClick={() => this.onSetSidebarOpen(true)}
        />
      </Sidebar>
    ) : (
      this.getContent()
    );
  }
}

export default AppContainer;
