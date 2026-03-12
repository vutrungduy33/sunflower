import { useDeferredValue, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Dialog,
  Input,
  InputNumber,
  MessagePlugin,
  Select,
  Space,
  Table,
  type TableProps,
  Tag,
  Textarea,
} from 'tdesign-react'
import {
  createAdminRoom,
  fetchAdminRooms,
  getAdminRoomErrorMessage,
  type AdminRoom,
  type AdminRoomStatus,
  type AdminRoomStatusFilter,
  type SaveAdminRoomPayload,
  updateAdminRoom,
} from '@/features/rooms/admin-room-service'

const ROOM_LIST_QUERY_KEY = ['admin-rooms']

const roomStatusLabelMap: Record<AdminRoomStatus, string> = {
  ACTIVE: '上架中',
  INACTIVE: '已下架',
}

const roomStatusOptions: Array<{ label: string; value: AdminRoomStatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  { label: roomStatusLabelMap.ACTIVE, value: 'ACTIVE' },
  { label: roomStatusLabelMap.INACTIVE, value: 'INACTIVE' },
]

interface RoomEditorValue {
  name: string
  subtitle: string
  cover: string
  capacity: number
  area: number
  bedType: string
  scenicType: string
  tagsText: string
  basePrice: number
  breakfast: string
  intro: string
  amenitiesText: string
  rulesText: string
  canCancelBeforeHours: number
  status: AdminRoomStatus
}

type RoomEditorField = keyof RoomEditorValue
type RoomEditorErrors = Partial<Record<RoomEditorField, string>>

function createEmptyEditorValue(): RoomEditorValue {
  return {
    name: '',
    subtitle: '',
    cover: '',
    capacity: 2,
    area: 36,
    bedType: '',
    scenicType: '',
    tagsText: '',
    basePrice: 388,
    breakfast: '',
    intro: '',
    amenitiesText: '',
    rulesText: '',
    canCancelBeforeHours: 24,
    status: 'ACTIVE',
  }
}

function createEditorValue(room?: AdminRoom): RoomEditorValue {
  if (!room) {
    return createEmptyEditorValue()
  }

  return {
    name: room.name,
    subtitle: room.subtitle,
    cover: room.cover,
    capacity: room.capacity,
    area: room.area,
    bedType: room.bedType,
    scenicType: room.scenicType,
    tagsText: room.tags.join('\n'),
    basePrice: room.basePrice,
    breakfast: room.breakfast,
    intro: room.intro,
    amenitiesText: room.amenities.join('\n'),
    rulesText: room.rules.join('\n'),
    canCancelBeforeHours: room.canCancelBeforeHours,
    status: room.status,
  }
}

function parseMultiValue(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toSafeNumber(value: number | string, fallback: number) {
  const nextValue = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function validateRoomEditorValue(value: RoomEditorValue): RoomEditorErrors {
  const errors: RoomEditorErrors = {}

  if (!value.name.trim()) {
    errors.name = '请输入房型名称'
  }
  if (!value.subtitle.trim()) {
    errors.subtitle = '请输入房型副标题'
  }
  if (!value.cover.trim()) {
    errors.cover = '请输入封面地址'
  }
  if (value.capacity <= 0) {
    errors.capacity = '入住人数必须大于 0'
  }
  if (value.area <= 0) {
    errors.area = '房间面积必须大于 0'
  }
  if (!value.bedType.trim()) {
    errors.bedType = '请输入床型描述'
  }
  if (!value.scenicType.trim()) {
    errors.scenicType = '请输入景观类型'
  }
  if (value.basePrice <= 0) {
    errors.basePrice = '基础价格必须大于 0'
  }
  if (!value.breakfast.trim()) {
    errors.breakfast = '请输入早餐说明'
  }
  if (!value.intro.trim()) {
    errors.intro = '请输入房型介绍'
  }
  if (value.canCancelBeforeHours < 0) {
    errors.canCancelBeforeHours = '取消时限不能小于 0'
  }

  return errors
}

function buildSavePayload(value: RoomEditorValue): SaveAdminRoomPayload {
  return {
    name: value.name.trim(),
    subtitle: value.subtitle.trim(),
    cover: value.cover.trim(),
    capacity: value.capacity,
    area: value.area,
    bedType: value.bedType.trim(),
    scenicType: value.scenicType.trim(),
    tags: parseMultiValue(value.tagsText),
    basePrice: value.basePrice,
    breakfast: value.breakfast.trim(),
    intro: value.intro.trim(),
    amenities: parseMultiValue(value.amenitiesText),
    rules: parseMultiValue(value.rulesText),
    canCancelBeforeHours: value.canCancelBeforeHours,
    status: value.status,
  }
}

function resolveRoomStatusTheme(status: AdminRoomStatus) {
  return status === 'ACTIVE' ? 'success' : 'warning'
}

export function RoomManagementPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminRoomStatusFilter>('ALL')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editorValue, setEditorValue] = useState<RoomEditorValue>(() => createEmptyEditorValue())
  const [editorErrors, setEditorErrors] = useState<RoomEditorErrors>({})
  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase())

  const roomListQuery = useQuery({
    queryKey: ROOM_LIST_QUERY_KEY,
    queryFn: fetchAdminRooms,
  })

  const saveRoomMutation = useMutation({
    mutationFn: async ({
      roomId,
      payload,
    }: {
      roomId: string | null
      payload: SaveAdminRoomPayload
    }) => {
      if (roomId) {
        return updateAdminRoom(roomId, payload)
      }

      return createAdminRoom(payload)
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ROOM_LIST_QUERY_KEY })
      MessagePlugin.success(variables.roomId ? '房型已更新' : '房型已创建')
      handleCloseDialog()
    },
    onError: (error) => {
      MessagePlugin.error(getAdminRoomErrorMessage(error))
    },
  })

  const toggleRoomMutation = useMutation({
    mutationFn: async (room: AdminRoom) => {
      const nextStatus: AdminRoomStatus = room.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      return updateAdminRoom(room.id, { status: nextStatus })
    },
    onSuccess: async (room) => {
      await queryClient.invalidateQueries({ queryKey: ROOM_LIST_QUERY_KEY })
      MessagePlugin.success(room.status === 'ACTIVE' ? '房型已上架' : '房型已下架')
    },
    onError: (error) => {
      MessagePlugin.error(getAdminRoomErrorMessage(error, '房型状态更新失败，请稍后重试'))
    },
  })

  const rooms = roomListQuery.data ?? []
  const totalCount = rooms.length
  const activeCount = rooms.filter((room) => room.status === 'ACTIVE').length
  const inactiveCount = totalCount - activeCount

  const filteredRooms = rooms.filter((room) => {
    const matchedKeyword =
      !deferredKeyword ||
      [
        room.name,
        room.subtitle,
        room.bedType,
        room.scenicType,
        room.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(deferredKeyword)

    const matchedStatus = statusFilter === 'ALL' || room.status === statusFilter

    return matchedKeyword && matchedStatus
  })

  const isEditMode = Boolean(editingRoomId)

  function updateEditorField<K extends RoomEditorField>(field: K, value: RoomEditorValue[K]) {
    setEditorValue((current) => ({
      ...current,
      [field]: value,
    }))
    setEditorErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function openCreateDialog() {
    setEditingRoomId(null)
    setEditorValue(createEmptyEditorValue())
    setEditorErrors({})
    setDialogVisible(true)
  }

  function openEditDialog(room: AdminRoom) {
    setEditingRoomId(room.id)
    setEditorValue(createEditorValue(room))
    setEditorErrors({})
    setDialogVisible(true)
  }

  function handleCloseDialog() {
    if (saveRoomMutation.isPending) {
      return
    }

    setDialogVisible(false)
    setEditingRoomId(null)
    setEditorValue(createEmptyEditorValue())
    setEditorErrors({})
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateRoomEditorValue(editorValue)
    if (Object.keys(nextErrors).length > 0) {
      setEditorErrors(nextErrors)
      MessagePlugin.error('请先修正表单错误')
      return
    }

    saveRoomMutation.mutate({
      roomId: editingRoomId,
      payload: buildSavePayload(editorValue),
    })
  }

  const roomColumns: TableProps<AdminRoom>['columns'] = [
    {
      colKey: 'name',
      title: '房型信息',
      minWidth: 320,
      cell: ({ row }) => (
        <div className="room-table__primary">
          <div className="room-table__heading">
            <strong>{row.name}</strong>
            <span>{row.subtitle}</span>
          </div>
          <div className="room-table__tags">
            {row.tags.length > 0 ? (
              row.tags.map((tag) => (
                <Tag key={tag} size="small" theme="default" variant="light-outline">
                  {tag}
                </Tag>
              ))
            ) : (
              <span className="room-table__muted">未配置标签</span>
            )}
          </div>
        </div>
      ),
    },
    {
      colKey: 'status',
      title: '状态',
      width: 120,
      cell: ({ row }) => (
        <Tag theme={resolveRoomStatusTheme(row.status)} variant="light-outline">
          {roomStatusLabelMap[row.status]}
        </Tag>
      ),
    },
    {
      colKey: 'base',
      title: '基础配置',
      minWidth: 280,
      cell: ({ row }) => (
        <dl className="room-table__facts">
          <div>
            <dt>入住</dt>
            <dd>{row.capacity} 人</dd>
          </div>
          <div>
            <dt>面积</dt>
            <dd>{row.area} m²</dd>
          </div>
          <div>
            <dt>床型</dt>
            <dd>{row.bedType}</dd>
          </div>
          <div>
            <dt>景观</dt>
            <dd>{row.scenicType}</dd>
          </div>
        </dl>
      ),
    },
    {
      colKey: 'price',
      title: '价格与规则',
      minWidth: 220,
      cell: ({ row }) => (
        <div className="room-table__pricing">
          <strong>¥{row.basePrice}</strong>
          <span>{row.breakfast}</span>
          <span>入住前 {row.canCancelBeforeHours} 小时可取消</span>
        </div>
      ),
    },
    {
      colKey: 'actions',
      title: '操作',
      width: 220,
      align: 'right',
      cell: ({ row }) => {
        const isToggling = toggleRoomMutation.isPending && toggleRoomMutation.variables?.id === row.id

        return (
          <Space align="center" size={12}>
            <Button
              size="small"
              theme="primary"
              variant="outline"
              onClick={() => openEditDialog(row)}
            >
              编辑
            </Button>
            <Button
              size="small"
              theme={row.status === 'ACTIVE' ? 'warning' : 'success'}
              variant="outline"
              loading={isToggling}
              onClick={() => toggleRoomMutation.mutate(row)}
            >
              {row.status === 'ACTIVE' ? '下架' : '上架'}
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="page-stack">
      <section className="hero-panel room-hero">
        <div className="hero-panel__copy">
          <Tag theme="success" variant="light-outline">
            S11 管理后台房型管理
          </Tag>
          <h3>房型基础信息维护</h3>
          <p>
            当前页面已接入管理端房型列表、创建/编辑和上下架操作，后续 `S12` 将在此基础上补齐价格日历与库存批量编辑。
          </p>
        </div>
        <div className="room-stat-grid">
          <article className="room-stat-card">
            <small>房型总数</small>
            <strong>{totalCount}</strong>
          </article>
          <article className="room-stat-card">
            <small>上架中</small>
            <strong>{activeCount}</strong>
          </article>
          <article className="room-stat-card">
            <small>已下架</small>
            <strong>{inactiveCount}</strong>
          </article>
        </div>
      </section>

      <Card className="panel-card room-toolbar-card">
        <div className="room-toolbar">
          <Input
            clearable
            placeholder="搜索房型名、标签、景观或床型"
            size="large"
            value={keyword}
            onChange={(value) => setKeyword(String(value))}
          />
          <Select
            size="large"
            value={statusFilter}
            options={roomStatusOptions}
            onChange={(value) => setStatusFilter(String(value) as AdminRoomStatusFilter)}
          />
          <Space align="center" size={12}>
            <Button
              variant="outline"
              onClick={() => void roomListQuery.refetch()}
              loading={roomListQuery.isFetching}
            >
              刷新列表
            </Button>
            <Button theme="primary" onClick={openCreateDialog}>
              新建房型
            </Button>
          </Space>
        </div>
      </Card>

      {roomListQuery.isError ? (
        <Card className="panel-card room-feedback-card">
          <div className="room-feedback-card__content">
            <Tag theme="danger" variant="light-outline">
              列表加载失败
            </Tag>
            <h3>房型列表加载失败</h3>
            <p>{getAdminRoomErrorMessage(roomListQuery.error, '请确认后端管理接口可用')}</p>
            <Button theme="primary" onClick={() => void roomListQuery.refetch()}>
              重新加载
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="panel-card room-table-card">
          <div className="room-table-card__header">
            <div>
              <h3>房型列表</h3>
              <p>当前筛选结果 {filteredRooms.length} 条，支持创建、编辑和上/下架。</p>
            </div>
            <Tag theme="warning" variant="light-outline">
              S7 API 已接入
            </Tag>
          </div>
          <Table
            bordered
            hover
            rowKey="id"
            size="medium"
            stripe
            columns={roomColumns}
            data={filteredRooms}
            loading={roomListQuery.isPending}
            empty={<div className="room-table__empty">当前筛选条件下暂无房型。</div>}
          />
        </Card>
      )}

      <Dialog
        destroyOnClose
        footer={false}
        header={isEditMode ? '编辑房型' : '新建房型'}
        visible={dialogVisible}
        width={960}
        onClose={handleCloseDialog}
      >
        <form className="room-editor" onSubmit={handleSubmit}>
          <div className="room-editor__grid">
            <label className="room-field">
              <span className="room-field__label">房型名称</span>
              <Input
                clearable
                placeholder="例如：270° 湖景家庭套房"
                status={editorErrors.name ? 'error' : 'default'}
                tips={editorErrors.name}
                value={editorValue.name}
                onChange={(value) => updateEditorField('name', String(value))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">房型副标题</span>
              <Input
                clearable
                placeholder="例如：露台泡池 | 可住 4 人"
                status={editorErrors.subtitle ? 'error' : 'default'}
                tips={editorErrors.subtitle}
                value={editorValue.subtitle}
                onChange={(value) => updateEditorField('subtitle', String(value))}
              />
            </label>

            <label className="room-field room-field--full">
              <span className="room-field__label">封面地址</span>
              <Input
                clearable
                placeholder="/images/rooms/lake-101.png"
                status={editorErrors.cover ? 'error' : 'default'}
                tips={editorErrors.cover}
                value={editorValue.cover}
                onChange={(value) => updateEditorField('cover', String(value))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">入住人数</span>
              <InputNumber
                min={1}
                status={editorErrors.capacity ? 'error' : 'default'}
                tips={editorErrors.capacity}
                value={editorValue.capacity}
                onChange={(value) => updateEditorField('capacity', toSafeNumber(value, 0))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">房间面积（m²）</span>
              <InputNumber
                min={1}
                status={editorErrors.area ? 'error' : 'default'}
                tips={editorErrors.area}
                value={editorValue.area}
                onChange={(value) => updateEditorField('area', toSafeNumber(value, 0))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">床型</span>
              <Input
                clearable
                placeholder="例如：1.8m 大床 + 沙发床"
                status={editorErrors.bedType ? 'error' : 'default'}
                tips={editorErrors.bedType}
                value={editorValue.bedType}
                onChange={(value) => updateEditorField('bedType', String(value))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">景观类型</span>
              <Input
                clearable
                placeholder="例如：湖景"
                status={editorErrors.scenicType ? 'error' : 'default'}
                tips={editorErrors.scenicType}
                value={editorValue.scenicType}
                onChange={(value) => updateEditorField('scenicType', String(value))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">基础价格</span>
              <InputNumber
                min={1}
                status={editorErrors.basePrice ? 'error' : 'default'}
                tips={editorErrors.basePrice}
                value={editorValue.basePrice}
                onChange={(value) => updateEditorField('basePrice', toSafeNumber(value, 0))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">早餐说明</span>
              <Input
                clearable
                placeholder="例如：含双早"
                status={editorErrors.breakfast ? 'error' : 'default'}
                tips={editorErrors.breakfast}
                value={editorValue.breakfast}
                onChange={(value) => updateEditorField('breakfast', String(value))}
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">可取消时限（小时）</span>
              <InputNumber
                min={0}
                status={editorErrors.canCancelBeforeHours ? 'error' : 'default'}
                tips={editorErrors.canCancelBeforeHours}
                value={editorValue.canCancelBeforeHours}
                onChange={(value) =>
                  updateEditorField('canCancelBeforeHours', toSafeNumber(value, 0))
                }
              />
            </label>

            <label className="room-field">
              <span className="room-field__label">上架状态</span>
              <Select
                value={editorValue.status}
                options={roomStatusOptions.filter((option) => option.value !== 'ALL')}
                onChange={(value) => updateEditorField('status', String(value) as AdminRoomStatus)}
              />
            </label>

            <label className="room-field room-field--full">
              <span className="room-field__label">房型介绍</span>
              <Textarea
                autosize={{ minRows: 3, maxRows: 5 }}
                placeholder="描述房型适合的人群和核心卖点"
                status={editorErrors.intro ? 'error' : 'default'}
                tips={editorErrors.intro}
                value={editorValue.intro}
                onChange={(value) => updateEditorField('intro', String(value))}
              />
            </label>

            <label className="room-field room-field--full">
              <span className="room-field__label">标签</span>
              <Textarea
                autosize={{ minRows: 2, maxRows: 4 }}
                placeholder="支持逗号或换行分隔，例如：湖景房, 家庭出游"
                tips="支持逗号或换行分隔。"
                value={editorValue.tagsText}
                onChange={(value) => updateEditorField('tagsText', String(value))}
              />
            </label>

            <label className="room-field room-field--full">
              <span className="room-field__label">设施</span>
              <Textarea
                autosize={{ minRows: 2, maxRows: 4 }}
                placeholder="支持逗号或换行分隔，例如：投影, 露台浴缸"
                tips="支持逗号或换行分隔。"
                value={editorValue.amenitiesText}
                onChange={(value) => updateEditorField('amenitiesText', String(value))}
              />
            </label>

            <label className="room-field room-field--full">
              <span className="room-field__label">入住规则</span>
              <Textarea
                autosize={{ minRows: 2, maxRows: 4 }}
                placeholder="支持逗号或换行分隔，例如：14:00 后入住"
                tips="支持逗号或换行分隔。"
                value={editorValue.rulesText}
                onChange={(value) => updateEditorField('rulesText', String(value))}
              />
            </label>
          </div>

          <div className="room-editor__footer">
            <p>标签、设施和规则字段会在保存时自动整理为数组。</p>
            <Space align="center" size={12}>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button loading={saveRoomMutation.isPending} theme="primary" type="submit">
                保存房型
              </Button>
            </Space>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
