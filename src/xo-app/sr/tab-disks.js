import _ from 'intl'
import ActionRow from 'action-row-button'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { deleteVdi, editVdi } from 'xo'
import { renderXoItemFromId } from 'render-xo-item'
import { Text } from 'editable'

// ===================================================================

const COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => (
      <span>
        <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
        {' '}
        {vdi.type === 'VDI-snapshot' &&
          <span className='tag tag-info'>
            <Icon icon='vm-snapshot' />
          </span>
        }
      </span>
    ),
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => (
      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
    )
  },
  {
    name: _('vdiVm'),
    itemRenderer: (vdi, vdisToVmIds) => {
      const id = vdisToVmIds[vdi.id]
      const Item = renderXoItemFromId(id)

      if (id) {
        return (
          <Link to={`/vms/${id}${vdi.type === 'VDI-snapshot' ? '/snapshots' : ''}`}>
            {Item}
          </Link>
        )
      }

      return Item
    }
  },
  {
    name: _('vdiTags'),
    itemRenderer: vdi => vdi.tags
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('vdiAction'),
    itemRenderer: vdi => (
      <ActionRow
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
      />
    )
  }
]

const FILTERS = {
  filterNoSnapshots: 'type:!VDI-snapshot',
  filterOnlyBaseCopy: 'type:VDI-unmanaged',
  filterOnlyRegularDisks: 'type:!VDI-unmanaged type:!VDI-snapshot',
  filterOnlySnapshots: 'type:VDI-snapshot'
}

// ===================================================================

export default ({ vdis, vdisUnmanaged, vdiSnapshots, vdisToVmIds }) => (
  <Container>
    <Row>
      <Col>
        {!isEmpty(vdis)
          ? <SortedTable collection={vdis.concat(vdiSnapshots, vdisUnmanaged)} userData={vdisToVmIds} columns={COLUMNS} filters={FILTERS} />
          : <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
        }
      </Col>
    </Row>
  </Container>
)