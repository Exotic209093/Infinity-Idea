import {
  Rectangle2d,
  T,
  type Geometry2d,
  type TLBaseShape,
  type TLResizeInfo,
  resizeBox,
} from "tldraw";

export const baseProps = {
  w: T.number,
  h: T.number,
  label: T.string,
};

export function baseGeometry(shape: { props: { w: number; h: number } }): Geometry2d {
  return new Rectangle2d({
    width: shape.props.w,
    height: shape.props.h,
    isFilled: true,
  });
}

export function onResize<S extends TLBaseShape<string, { w: number; h: number }>>(
  shape: S,
  info: TLResizeInfo<S>,
) {
  return resizeBox(shape, info);
}
