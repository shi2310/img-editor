/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';
import { Icon, Popover, Radio, Divider } from 'antd';
import { fabric } from 'fabric';
import _ from 'lodash';
import classnames from 'classnames';
import style from './ToolBar.less';

const Icons = [
  { name: '绘制', type: 'highlight' },
  { name: '箭头', type: 'arrow-right' },
  { name: '直线', type: 'minus' },
  { name: '虚线', type: 'small-dash' },
  { name: '矩形', type: 'border' },
  { name: '圆形', type: 'sync' },
  { name: '文本', type: 'info' },
  { name: '删除', type: 'delete' },
];

const drawWidthArray = [
  { size: 1, title: '小号' },
  { size: 2, title: '普通' },
  { size: 4, title: '大号' },
];

class MenuBar extends React.PureComponent {
  state = {
    liChecked: '',
    color: 'red',
    drawWidthArray,
    drawWidthIndex: 1,
  };

  canvas = null;

  mouseFrom = {};

  mouseTo = {};

  drawingObject = null;

  componentWillReceiveProps(newProps) {
    if (newProps.canvas && newProps.canvas !== this.props.canvas) {
      this.canvas = newProps.canvas;

      let doDrawing = false;
      // 绑定画板事件
      this.canvas.on('mouse:down', options => {
        if (this.state.liChecked || this.canvas.getActiveObject()) {
          options.e.preventDefault();
          options.e.stopPropagation();
          if (this.state.liChecked) {
            doDrawing = true;
            this.mouseFrom = this.canvas.getPointer(options.e);
            this.onceTrigger();
          }
        }
      });
      this.canvas.on(
        'mouse:move',
        _.debounce(options => {
          if (doDrawing) {
            options.e.preventDefault();
            options.e.stopPropagation();
            this.mouseTo = this.canvas.getPointer(options.e);
            this.keepTrigger();
          }
        }, 7)
      );
      this.canvas.on('mouse:up', () => {
        this.drawingObject = null;
        doDrawing = false;
      });

      // 对象选中时
      this.canvas.on('selection:created', options => {
        if (this.state.liChecked === '删除') {
          if (options.selected) {
            // 多选删除
            const etCount = options.selected.length;
            for (let etindex = 0; etindex < etCount; etindex++) {
              this.canvas.remove(options.selected[etindex]);
            }
          }
          this.canvas.discardActiveObject().renderAll(); // 清除选中框
        }
      });

      // canvas内部元素缩放
      // this.canvas.on('mouse:wheel', opt => {
      //   opt.e.preventDefault();
      //   opt.e.stopPropagation();

      //   let zoom = (opt.e.deltaY > 0 ? 0.1 : -0.1) + this.canvas.getZoom();
      //   zoom = Math.max(0.1, zoom); // 最小为原来的1/10
      //   zoom = Math.min(10, zoom); // 最大是原来的10倍
      //   const zoomCenter = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      //   this.canvas.zoomToPoint(zoomCenter, zoom);
      // });
    }

    if (newProps.scrollScale && newProps.scrollScale !== this.props.scrollScale) {
      const _scale = newProps.scrollScale;
      // 根据比例计算线粗数组
      const _drawWidthArray = _.map(drawWidthArray, obj => ({
        ...obj,
        size: obj.size * _scale,
      }));
      this.setState({
        drawWidthArray: _drawWidthArray,
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.color !== this.state.color) {
      this.canvas.freeDrawingBrush.color = this.state.color;
    }
    if (
      prevState.drawWidthIndex !== this.state.drawWidthIndex ||
      prevState.drawWidthArray !== this.state.drawWidthArray
    ) {
      this.canvas.freeDrawingBrush.width = this.state.drawWidthArray[
        this.state.drawWidthIndex
      ].size;
    }
  }

  componentWillUnmount() {
    this.canvas.removeListeners();
    this.canvas = null;
  }

  liClick = name => {
    let checked = null;
    if (this.state.liChecked !== name) {
      checked = name;
    }
    this.setState({
      liChecked: checked,
    });

    this.canvas.isDrawingMode = false;
    this.canvas.discardActiveObject().renderAll(); // 清除选中框
    this.canvas.skipTargetFind = true; // 画板元素不能被选中
    this.canvas.selection = false; // 画板不显示选中

    // 工具栏上直接触发的事件
    if (checked === '绘制') {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.state.color;
      this.canvas.freeDrawingBrush.width = this.state.drawWidthArray[
        this.state.drawWidthIndex
      ].size;
    } else if (checked === '删除' || checked === null) {
      this.canvas.selectable = true; // 控件能被选择并操作
      this.canvas.selection = true; // 画板显示控件被选中
      this.canvas.skipTargetFind = false; // 画板元素能被选中
    }
  };

  // 鼠标在canvas中按下时根据工具菜单选中而触发的非持续绘制事件
  onceTrigger = () => {
    if (this.state.liChecked) {
      const f_x = this.mouseFrom.x;
      const f_y = this.mouseFrom.y;
      switch (this.state.liChecked) {
        case '文本': {
          const textbox = new fabric.Textbox('Hello', {
            left: f_x,
            top: f_y,
            width: 100,
            hasControls: true,
            fontSize: 18,
            fill: this.state.color,
          });
          this.canvas.add(textbox);
          break;
        }
        default:
          break;
      }
    }
  };

  // 鼠标在canvas中拖动时根据工具菜单选中而触发的持续绘制事件
  keepTrigger = () => {
    if (this.drawingObject) {
      this.canvas.remove(this.drawingObject);
    }

    const f_x = this.mouseFrom.x;
    const f_y = this.mouseFrom.y;
    const t_x = this.mouseTo.x;
    const t_y = this.mouseTo.y;

    const options = {
      stroke: this.state.color,
      strokeWidth: this.state.drawWidthArray[this.state.drawWidthIndex].size,
    };

    let path = null;
    switch (this.state.liChecked) {
      case '箭头':
        path = this.drawArrow(f_x, f_y, t_x, t_y, 30, _.multiply(10, options.strokeWidth));
        this.drawingObject = new fabric.Path(path, {
          fill: 'rgba(255,255,255,0)',
          ...options,
        });
        break;
      case '直线':
        path = [f_x, f_y, t_x, t_y];
        this.drawingObject = new fabric.Line(path, {
          ...options,
        });
        break;
      case '虚线':
        path = [f_x, f_y, t_x, t_y];
        this.drawingObject = new fabric.Line(path, {
          strokeDashArray: [options.strokeWidth * 3, options.strokeWidth],
          ...options,
        });
        break;
      case '圆形': {
        let rx = Math.abs(f_x - t_x) / 2;
        let ry = Math.abs(f_y - t_y) / 2;
        if (rx > options.strokeWidth) {
          rx -= options.strokeWidth / 2;
        }
        if (ry > options.strokeWidth) {
          ry -= options.strokeWidth / 2;
        }

        let originX = null;
        if (f_x > t_x) {
          originX = 'right';
        } else {
          originX = 'left';
        }
        let originY = null;
        if (f_y > t_y) {
          originY = 'bottom';
        } else {
          originY = 'top';
        }

        // const radius = Math.sqrt((t_x - f_x) * (t_x - f_x) + (t_y - f_y) * (t_y - f_y)) / 2;
        this.drawingObject = new fabric.Ellipse({
          left: f_x,
          top: f_y,
          originX,
          originY,
          rx,
          ry,
          angle: 0,
          fill: 'rgba(255, 255, 255, 0)',
          ...options,
        });
        break;
      }
      case '矩形': {
        path = `M ${f_x} ${f_y} L ${t_x} ${f_y} L ${t_x} ${t_y} L ${f_x} ${t_y} L ${f_x} ${f_y} z`;
        this.drawingObject = new fabric.Path(path, {
          fill: 'rgba(255, 255, 255, 0)',
          ...options,
        });
        // 也可以使用fabric.Rect
        break;
      }
      default:
        break;
    }
    if (this.drawingObject) {
      this.canvas.add(this.drawingObject);
      this.canvas.renderAll();
    }
  };

  // 绘制箭头方法
  // 起点P1(fromX, fromY),终点P2(toX, toY),三角斜边直线夹角theta,三角斜边长度headlen
  drawArrow = (fromX, fromY, toX, toY, theta, headlen) => {
    theta = typeof theta !== 'undefined' ? theta : 30;
    headlen = typeof theta !== 'undefined' ? headlen : 20;
    // 计算各角度和对应的P2,P3坐标
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;
    const topX = headlen * Math.cos(angle1);
    const topY = headlen * Math.sin(angle1);
    const botX = headlen * Math.cos(angle2);
    const botY = headlen * Math.sin(angle2);
    let arrowX = fromX - topX;

    let arrowY = fromY - topY;
    let path = ` M ${fromX} ${fromY}`;
    path += ` L ${toX} ${toY}`;
    arrowX = toX + topX;
    arrowY = toY + topY;
    path += ` M ${arrowX} ${arrowY}`;
    path += ` L ${toX} ${toY}`;
    arrowX = toX + botX;
    arrowY = toY + botY;
    path += ` L ${arrowX} ${arrowY}`;
    return path;
  };

  colorPicker = color => {
    this.setState({
      color,
    });
  };

  sizePicker = index => {
    this.setState({ drawWidthIndex: index });
  };

  // 根据比例重新设置canvas和对象，以及缩放比影响的state
  reRenderCanvasByScale = scale => {
    // 将canvas按照比例尺还原成图片大小
    this.canvas.setHeight(this.canvas.getHeight() * scale);
    this.canvas.setWidth(this.canvas.getWidth() * scale);

    // 将背景图按照比例尺还原成原始图片大小
    if (this.canvas.backgroundImage) {
      const bi = this.canvas.backgroundImage;
      bi.scaleX *= scale;
      bi.scaleY *= scale;
    }

    // 将对象按照比例尺设置
    const objects = this.canvas.getObjects();
    _.each(objects, object => {
      object.scaleX *= scale;
      object.scaleY *= scale;
      object.left *= scale;
      object.top *= scale;
      object.setCoords();
    });
    this.canvas.calcOffset();
    this.canvas.renderAll();
  };

  submitClick = () => {
    // 获取背景图被缩放的比例尺
    const _scale = 1 / this.canvas.backgroundImage.scaleX;
    this.reRenderCanvasByScale(_scale);
    this.setState({
      drawWidthArray,
    });

    const dataURL = this.canvas.toDataURL({
      format: 'png',
      enableRetinaScaling: true,
      multiplier: 1,
    });
    // 交给父组件处理转化的图片
    if (typeof this.props.upload === 'function') {
      this.props.upload(dataURL);
    }
  };

  originImageClick = () => {
    // 获取背景图被缩放的比例尺
    const _scale = 1 / this.canvas.backgroundImage.scaleX;
    this.reRenderCanvasByScale(_scale);
    this.setState({
      drawWidthArray,
    });
  };

  render() {
    return (
      <div className={style.box}>
        <ul>
          <li className={style.li}>
            <Popover
              placement="right"
              content={
                <Radio.Group size="large" value={this.state.color}>
                  {_.map(['red', 'blue', 'yellow', 'green'], _color => (
                    <Radio.Button
                      key={_color}
                      value={_color}
                      onClick={this.colorPicker.bind(this, _color)}
                    >
                      <Icon type="bg-colors" style={{ color: _color, fontSize: '25px' }} />
                    </Radio.Button>
                  ))}
                </Radio.Group>
              }
            >
              <Icon type="bg-colors" style={{ color: this.state.color }} />
            </Popover>
          </li>
          <li className={style.li}>
            <Popover
              placement="right"
              content={
                <Radio.Group size="large" value={this.state.drawWidthIndex}>
                  {_.map(this.state.drawWidthArray, ({ title }, i) => (
                    <Radio.Button key={i} value={i} onClick={this.sizePicker.bind(this, i)}>
                      {title}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              }
            >
              <Icon type="bold" />
            </Popover>
          </li>
          <Divider />
          {_.reduce(
            Icons,
            (result, item, i) => {
              result.push(
                <li
                  key={i}
                  onClick={() => {
                    this.liClick(item.name);
                  }}
                  title={item.name}
                  className={classnames([
                    style.li,
                    { [style.focus]: item.name === this.state.liChecked },
                  ])}
                >
                  <Icon type={item.type} />
                </li>
              );
              return result;
            },
            []
          )}
        </ul>
        <ul>
          <li onClick={() => this.originImageClick()} title="原图" className={style.li}>
            <Icon type="shrink" />
          </li>
          <li onClick={() => this.submitClick()} title="提交" className={style.li}>
            <Icon type="upload" />
          </li>
        </ul>
      </div>
    );
  }
}

export default MenuBar;
