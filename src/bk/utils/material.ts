export const parseMaterialData = (value: any) => {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    }
    catch {
      return null
    }
  }
  if (typeof value === 'object') return value
  return null
}

export const resolveMaterialCover = (item: any) => {
  const materialData = parseMaterialData(item?.materialData)
  if (materialData) {
    if (materialData?.cover) return materialData.cover
    return ''
  }
  return item?.thumbnailUrl || item?.cover || item?.imageUrl || item?.url || ''
}

export const mapMaterialGroups = (groups: any[] = [], limitPerGroup = 6) => {
  return groups.map((group: any, groupIndex: number) => {
    const children = Array.isArray(group?.list)
      ? group.list.filter((child: any) => child?.parentId !== 0)
      : []

    const items = children.flatMap((child: any, childIndex: number) => {
      const category = child?.name || '未分类'
      const childData = Array.isArray(child?.data) ? child.data : []

      return childData.map((item: any, itemIndex: number) => ({
        id: item?.id || `${group?.id || groupIndex}-${child?.id || childIndex}-${itemIndex}`,
        width: item?.width || 0,
        height: item?.height || 0,
        src: resolveMaterialCover(item),
        category,
      }))
    }).filter((item: any) => !!item.src).slice(0, limitPerGroup)

    const categories = Array.from(new Set(items.map((item: any) => item.category).filter(Boolean))) as string[]

    return {
      key: String(group?.id || groupIndex),
      label: group?.groupName || `分组${groupIndex + 1}`,
      categories: ['全部', ...categories],
      items,
    }
  }).filter((section: any) => section.items.length > 0)
}

export const flattenMaterialItems = (groups: any[] = [], limitPerGroup = 6) => {
  const mapped = mapMaterialGroups(groups, limitPerGroup)
  return mapped.flatMap((section: any) => section.items)
}

export const mapMaterialOtherData = (types: any[] = [], limitPerGroup = 6) => {
  return types.flatMap((type: any) => {
    const typeName = type?.typeName || ''
    const groups = Array.isArray(type?.groups) ? type.groups : []

    return groups.map((group: any, groupIndex: number) => {
      const groupName = group?.groupName || `分组${groupIndex + 1}`
      const materials = Array.isArray(group?.materials) ? group.materials : []

      const items = materials.flatMap((material: any, materialIndex: number) => {
        const category = material?.name || '未分类'
        const materialData = Array.isArray(material?.data) ? material.data : []

        return materialData.map((item: any, itemIndex: number) => ({
          id: item?.id || `${type?.typeId || 0}-${group?.groupId || groupIndex}-${materialIndex}-${itemIndex}`,
          width: item?.width || 0,
          height: item?.height || 0,
          src: resolveMaterialCover(item),
          category,
        }))
      }).filter((item: any) => !!item.src).slice(0, limitPerGroup)

      const categories = Array.from(new Set(items.map((item: any) => item.category).filter(Boolean))) as string[]

      return {
        key: `${typeName}-${group?.groupId || groupIndex}`,
        label: groupName,
        categories: ['全部', ...categories],
        items,
      }
    })
  })
}
