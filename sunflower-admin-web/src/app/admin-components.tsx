import type { ReactNode } from 'react'
import {
  Button as AntButton,
  DatePicker as AntDatePicker,
  Drawer as AntDrawer,
  Input as AntInput,
  InputNumber as AntInputNumber,
  Modal,
  Select as AntSelect,
  Space as AntSpace,
  Tag as AntTag,
  message,
  type ButtonProps as AntButtonProps,
} from 'antd'
import { ProCard, ProTable, type ProColumns } from '@ant-design/pro-components'
import dayjs from 'dayjs'

type AdminTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger'
type AdminVariant = 'base' | 'outline' | 'text' | 'light-outline'
type AdminSize = 'small' | 'medium' | 'large'

function mapSize(size?: AdminSize) {
  return size === 'medium' ? 'middle' : size
}

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export interface ButtonProps {
  block?: boolean
  children?: ReactNode
  className?: string
  disabled?: boolean
  loading?: boolean
  size?: AdminSize
  theme?: AdminTheme
  type?: 'button' | 'submit' | 'reset'
  variant?: AdminVariant
  onClick?: () => void
}

export function Button({
  block,
  children,
  className,
  disabled,
  loading,
  size,
  theme = 'default',
  type = 'button',
  variant,
  onClick,
}: ButtonProps) {
  const buttonType: AntButtonProps['type'] =
    variant === 'text'
      ? 'text'
      : theme === 'primary' && variant !== 'outline'
        ? 'primary'
        : 'default'

  return (
    <AntButton
      block={block}
      className={cx(`admin-btn--${theme}`, variant ? `admin-btn--${variant}` : null, className)}
      danger={theme === 'danger'}
      disabled={disabled}
      htmlType={type}
      loading={loading}
      size={mapSize(size)}
      type={buttonType}
      onClick={onClick}
    >
      {children}
    </AntButton>
  )
}

export function Card({
  children,
  className,
  title,
}: {
  children?: ReactNode
  className?: string
  title?: ReactNode
}) {
  return (
    <ProCard className={className} title={title} bordered>
      {children}
    </ProCard>
  )
}

export function Dialog({
  children,
  destroyOnClose,
  footer,
  header,
  visible,
  width,
  onClose,
}: {
  children?: ReactNode
  destroyOnClose?: boolean
  footer?: false | ReactNode
  header?: ReactNode
  visible?: boolean
  width?: number | string
  onClose?: () => void
}) {
  return (
    <Modal
      destroyOnClose={destroyOnClose}
      footer={footer === false ? null : footer}
      open={visible}
      title={header}
      width={width}
      onCancel={onClose}
    >
      {children}
    </Modal>
  )
}

export function Drawer({
  children,
  destroyOnClose,
  footer,
  header,
  size,
  visible,
  onClose,
}: {
  children?: ReactNode
  closeBtn?: boolean
  destroyOnClose?: boolean
  footer?: false | ReactNode
  header?: ReactNode
  size?: 'large'
  visible?: boolean
  onClose?: () => void
}) {
  return (
    <AntDrawer
      destroyOnClose={destroyOnClose}
      footer={footer === false ? null : footer}
      open={visible}
      placement="right"
      title={header}
      width={size === 'large' ? 760 : 520}
      onClose={onClose}
    >
      {children}
    </AntDrawer>
  )
}

export function Input({
  clearable,
  placeholder,
  size,
  status,
  type,
  value,
  onChange,
}: {
  clearable?: boolean
  placeholder?: string
  size?: AdminSize
  status?: 'default' | 'error'
  tips?: ReactNode
  type?: string
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <AntInput
      allowClear={clearable}
      placeholder={placeholder}
      size={mapSize(size)}
      status={status === 'error' ? 'error' : undefined}
      type={type}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}

export function Textarea({
  autosize,
  placeholder,
  status,
  value,
  onChange,
}: {
  autosize?: { minRows?: number; maxRows?: number }
  placeholder?: string
  status?: 'default' | 'error'
  tips?: ReactNode
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <AntInput.TextArea
      autoSize={autosize}
      placeholder={placeholder}
      status={status === 'error' ? 'error' : undefined}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}

export function InputNumber({
  min,
  placeholder,
  status,
  value,
  onChange,
}: {
  min?: number
  placeholder?: string
  status?: 'default' | 'error'
  tips?: ReactNode
  value?: number
  onChange?: (value: number | string) => void
}) {
  return (
    <AntInputNumber
      min={min}
      placeholder={placeholder}
      status={status === 'error' ? 'error' : undefined}
      style={{ width: '100%' }}
      value={value}
      onChange={(nextValue) => onChange?.(typeof nextValue === 'number' ? nextValue : '')}
    />
  )
}

export function Select<T extends string | number = string>({
  options,
  size,
  value,
  onChange,
}: {
  options?: Array<{ label: ReactNode; value: T }>
  size?: AdminSize
  value?: T
  onChange?: (value: T) => void
}) {
  return (
    <AntSelect
      options={options}
      size={mapSize(size)}
      style={{ width: '100%' }}
      value={value}
      onChange={(nextValue) => onChange?.(nextValue as T)}
    />
  )
}

export function DatePicker({
  clearable,
  format,
  placeholder,
  value,
  onChange,
}: {
  clearable?: boolean
  format?: string
  placeholder?: string
  value?: string
  valueType?: string
  onChange?: (value: string) => void
}) {
  return (
    <AntDatePicker
      allowClear={clearable}
      format={format}
      placeholder={placeholder}
      style={{ width: '100%' }}
      value={value ? dayjs(value) : null}
      onChange={(_, dateString) => {
        onChange?.(Array.isArray(dateString) ? dateString[0] ?? '' : dateString)
      }}
    />
  )
}

export function Space({
  align,
  children,
  direction,
  size,
  style,
}: {
  align?: 'center' | 'start' | 'end'
  children?: ReactNode
  direction?: 'horizontal' | 'vertical'
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <AntSpace align={align} direction={direction} size={size} style={style} wrap>
      {children}
    </AntSpace>
  )
}

const tagColorMap: Record<AdminTheme, string | undefined> = {
  default: undefined,
  primary: 'blue',
  success: 'green',
  warning: 'gold',
  danger: 'red',
}

export function Tag({
  children,
  size,
  theme = 'default',
}: {
  children?: ReactNode
  size?: 'small'
  theme?: AdminTheme
  variant?: AdminVariant
}) {
  return (
    <AntTag className={size === 'small' ? 'admin-tag--small' : undefined} color={tagColorMap[theme]}>
      {children}
    </AntTag>
  )
}

export interface TableColumn<T extends object> {
  align?: 'left' | 'right' | 'center'
  cell?: (context: { row: T }) => ReactNode
  colKey: string
  minWidth?: number
  title: ReactNode
  width?: number
}

export interface TableProps<T extends object> {
  bordered?: boolean
  columns: Array<TableColumn<T>>
  data: T[]
  empty?: ReactNode
  hover?: boolean
  loading?: boolean
  rowKey: keyof T | string
  size?: AdminSize
  stripe?: boolean
}

export function Table<T extends object>({
  bordered,
  columns,
  data,
  empty,
  loading,
  rowKey,
  size,
}: TableProps<T>) {
  const proColumns: ProColumns<T>[] = columns.map((column) => ({
    align: column.align,
    dataIndex: column.colKey,
    key: column.colKey,
    title: column.title,
    width: column.width ?? column.minWidth,
    render: (_, record) =>
      (column.cell
        ? column.cell({ row: record })
        : (record as Record<string, unknown>)[column.colKey]) as ReactNode,
  }))

  return (
    <ProTable<T>
      bordered={bordered}
      className="admin-data-table"
      columns={proColumns}
      dataSource={data}
      loading={loading}
      locale={{ emptyText: empty }}
      options={false}
      pagination={false}
      rowKey={rowKey as string}
      search={false}
      size={mapSize(size)}
      toolBarRender={false}
    />
  )
}

// Static message helper kept for migrated business pages.
// eslint-disable-next-line react-refresh/only-export-components
export const MessagePlugin = {
  error: (content: ReactNode) => {
    void message.error(content)
  },
  success: (content: ReactNode) => {
    void message.success(content)
  },
}
