// eslint-disable-next-line import/no-extraneous-dependencies
import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import cn from 'classnames';
import { getTargetPosition } from './utils';
import dialog from './Modal';

class Node extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: '',
    };

    this.menu = React.createRef();
    this.nodeType = this.getType(props.info);
  }

  componentDidMount() {
    const { connectDragPreview } = this.props;
    if (connectDragPreview) {
      connectDragPreview(getEmptyImage(), { captureDraggingState: true });
    }
  }

  getType = ({ docId, url }) => {
    if (docId === null && url === null) {
      return 'toc';
    }
    if (docId === null) {
      return 'external';
    }
    return 'doc';
  };

  // open this toc url
  // why js link ？
  // The safair browser will have an extra preview image when dragging the link.
  handleLink = () => {
    if (this.nodeType === 'toc') return;
    if (this.nodeType === 'external') {
      window.open(this.getUrl());
      return;
    }

    window.Turbolinks.visit(this.getUrl());
  };

  getUrl = () => {
    const {
      info: { url },
      repository,
    } = this.props;
    if (url && !url.includes('/')) {
      return `${repository.path}/${url}`;
    }
    return url;
  };

  updatePosition = (position) => {
    if (position !== this.state.position) {
      this.setState({ position });
    }
  };

  // delete this toc
  handleDelete = () => {
    const {
      onDeleteNode,
      info: { id },
      path,
      active,
    } = this.props;
    onDeleteNode({ id, path, reload: active });
  };

  // update toc info {title, url}
  handleUpdate = () => {
    const {
      info, t, path, onUpdateNode, active, repository,
    } = this.props;
    dialog({
      title: t('.Setting Doc'),
      type: 'updateToc',
      nodeType: this.nodeType,
      info,
      repository,
      t,
      active,
      onSuccessBack: (result) => {
        onUpdateNode({
          result,
          path,
          reload: info.title !== result.title,
        });
      },
    });
  };

  // create child toc
  handleCreate = () => {
    const {
      info, t, path, onCreateNode, repository,
    } = this.props;
    dialog({
      title: t('.Add a Doc inside'),
      type: 'createToc',
      repository,
      info,
      t,
      onSuccessBack: (result) => {
        onCreateNode
          && onCreateNode({
            info: result,
            path,
          });
      },
    });
  };

  // Automatically restore the menu state when the mouse leaves
  toggleMenu = () => {
    if (this.props.editMode && this.menu) {
      this.menu.current.removeAttribute('open');
    }
  };

  hasChildren = ({ children = [] }) => children && children.length > 0;

  render() {
    const {
      active,
      info,
      isOver,
      isDragging,
      canDrop,
      connectDragSource,
      connectDropTarget,
      path,
      editMode,
      toggleExpaned,
      t,
    } = this.props;
    const { position } = this.state;
    const depth = path.length - 1;
    const hasChildren = this.hasChildren(info);
    const { expanded, title } = info;
    return connectDragSource(
      connectDropTarget(
        <li
          className={cn(
            'toc-item',
            {
              [`drop-${position}`]: isOver && canDrop && !!position,
            },
            { active },
            {
              'toc-item-dragging': isDragging,
            },
          )}
          style={{
            marginLeft: `${depth * 15}px`,
            opacity: isDragging ? 0.6 : 1,
          }}
          onMouseLeave={this.toggleMenu}
          data-link={this.nodeType === 'toc' ? 'false' : 'true'}
        >
          <div className="item-link text-link">
            {hasChildren && (
              <i
                onClick={() => toggleExpaned({ path, expanded })}
                className={cn('fas fa-arrow', { folder: expanded })}
              />
            )}
            <span onClick={this.handleLink}>{title}</span>
          </div>
          <div className="item-connect-line" />
          <div className="item-slug" onClick={this.handleLink}>
            {info.url}
          </div>
          {editMode && (
            <details className="item-more dropdown details-overlay details-reset" ref={this.menu}>
              <summary>
                <i className="fas fa-ellipsis" />
              </summary>
              <ul className="dropdown-menu dropdown-menu-sw">
                <li className="dropdown-item" onClick={this.handleCreate}>
                  {t('.Add a Doc inside')}
                </li>
                <li className="dropdown-divider" />
                <li className="dropdown-item" onClick={this.handleUpdate}>
                  {t('.Setting Doc')}
                </li>
                <li className="dropdown-item text-danger" onClick={this.handleDelete}>
                  {t('.Delete doc')}
                </li>
              </ul>
            </details>
          )}
        </li>,
      ),
    );
  }
}

export default DropTarget(
  'toc',
  {
    drop(props, monitor, component) {
      const position = getTargetPosition(props, monitor, component);
      return {
        targetId: props.info.id,
        targetPath: props.path,
        position,
        canDrop: true,
      };
    },
    hover(props, monitor, component) {
      const position = getTargetPosition(props, monitor, component);
      component.updatePosition(position);
    },
    canDrop(props, monitor) {
      const { originalPath } = monitor.getItem();
      const { path } = props;
      return !originalPath.every((i, idx) => i === path[idx]);
    },
  },
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: !!monitor.isOver(),
    canDrop: !!monitor.canDrop(),
  }),
)(
  DragSource(
    'toc',
    {
      canDrag(props) {
        return props.editMode;
      },
      beginDrag: props => ({
        dragId: props.info.id,
        originalPath: props.path,
        info: props.info,
        active: props.active,
      }),
      endDrag(props, monitor) {
        if (!monitor.didDrop()) return;
        const { canDrop, ...resultDrop } = monitor.getDropResult();
        if (!canDrop) return;
        props.moveNode({ ...monitor.getItem(), ...resultDrop });
      },
      isDragging(props, monitor) {
        const { originalPath } = monitor.getItem();
        const { path } = props;
        return originalPath.every((i, idx) => i === path[idx]);
      },
    },
    (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      connectDragPreview: connect.dragPreview(),
      isDragging: monitor.isDragging(),
    }),
  )(Node),
);
