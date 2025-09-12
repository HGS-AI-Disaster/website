import React, { useEffect, useState } from "react"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar"
import { Button } from "./ui/button"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AddLayer from "./AddLayer"
import EditLayer from "./EditLayer"
import EditVisibility from "./EditVisibility"
import DeleteLayer from "./DeleteLayer"
import { getLayers } from "@/supabase/actions/layer"
import { toast } from "sonner"
import { useSelector } from "react-redux"

const sortByDate = (rowA, rowB, columnId) => {
  const parseDate = (str) => {
    const [day, month, year] = str.split("/")
    return new Date(`${year}-${month}-${day}`) // Format ISO
  }

  const dateA = parseDate(rowA.getValue(columnId))
  const dateB = parseDate(rowB.getValue(columnId))

  return dateA - dateB
}

export const columns = [
  {
    accessorKey: "layer",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Layer name</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            // onClick={() => console.log(column)}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("layer")}</div>,
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Category</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "layer_date",
    sortingFn: sortByDate,
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Layer date</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("layer_date")}</div>
    },
  },
  {
    accessorKey: "created_at",
    sortingFn: sortByDate,
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Date uploaded</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("created_at").slice(0, 10)}</div>
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <div className="flex items-center gap-1">
        <div className="">Source</div>
        <Button
          variant="ghost"
          className="hover:bg-gray-200 !p-1 h-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("source")}</div>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("visibility")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="action flex gap-2">
          <EditLayer layer={row.original} />
          <EditVisibility layer={row} />
          <DeleteLayer layer={row} />
        </div>
      )
    },
  },
]

function LayerManagement() {
  const { data: layersData, status } = useSelector((state) => state.layers)
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: layersData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const getUniqueValues = (raw, key) => {
    return [...new Set(raw.map((item) => item[key]))]
  }

  // const fetchData = async () => {
  //   try {
  //     const data = await getLayers()
  //     setData(data)
  //     setRawData(data)
  //   } catch (error) {
  //     toast.error(error)
  //   }
  //   setLoading(false)
  // }

  // useEffect(() => {
  //   fetchData()

  //   if (layersData.length) {

  //   }
  // }, [layersData])

  return (
    <div className="bg-gray-200 p-12">
      <div className="bg-gray-50 py-8 px-12 rounded-lg  overflow-x-auto">
        <div className="heading flex items-center">
          <div className="title flex-1">
            <div className="text-xl font-semibold">Layer Management</div>
            <div className="text-gray-400">Manage Layer (TIFF and GeoJSON)</div>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <Input
              placeholder="Search layer..."
              value={table.getColumn("layer")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("layer")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Filter</MenubarTrigger>

                <MenubarContent>
                  <MenubarItem onClick={() => table.setColumnFilters([])}>
                    View All
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Layer</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem
                        onClick={() =>
                          table.getColumn("layer")?.setFilterValue("")
                        }
                      >
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {getUniqueValues(layersData, "layer").map((value) => (
                        <MenubarItem
                          key={value}
                          onClick={() => {
                            table.setColumnFilters([])
                            table.getColumn("layer")?.setFilterValue(value)
                          }}
                        >
                          {value}
                        </MenubarItem>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Category</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem
                        onClick={() =>
                          table.getColumn("category")?.setFilterValue("")
                        }
                      >
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {getUniqueValues(layersData, "category").map((value) => (
                        <MenubarItem
                          key={value}
                          onClick={() => {
                            table.setColumnFilters([])
                            table.getColumn("category")?.setFilterValue(value)
                          }}
                        >
                          {value}
                        </MenubarItem>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Layer date</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem
                        onClick={() =>
                          table.getColumn("layer_date")?.setFilterValue("")
                        }
                      >
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {getUniqueValues(layersData, "layer_date").map(
                        (value) => (
                          <MenubarItem
                            key={value}
                            onClick={() => {
                              table.setColumnFilters([])
                              table
                                .getColumn("layer_date")
                                ?.setFilterValue(value)
                            }}
                          >
                            {value}
                          </MenubarItem>
                        )
                      )}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Date uploaded</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem onClick={() => table.setColumnFilters([])}>
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {getUniqueValues(layersData, "created_at").map(
                        (value) => (
                          <MenubarItem
                            key={value}
                            onClick={() => {
                              table.setColumnFilters([])
                              table
                                .getColumn("created_at")
                                ?.setFilterValue(value)
                            }}
                          >
                            {value.slice(0, 10)}
                            <span className="text-xs text-gray-500">
                              at {value.slice(11, 16)}
                            </span>
                          </MenubarItem>
                        )
                      )}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Source</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem
                        onClick={() =>
                          table.getColumn("source")?.setFilterValue("")
                        }
                      >
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {getUniqueValues(layersData, "source").map((value) => (
                        <MenubarItem
                          key={value}
                          onClick={() => {
                            table.setColumnFilters([])
                            table.getColumn("source")?.setFilterValue(value)
                          }}
                        >
                          {value}
                        </MenubarItem>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Visibility</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem onClick={() => table.setColumnFilters([])}>
                        View all
                      </MenubarItem>
                      <MenubarSeparator />
                      {layersData?.length &&
                        getUniqueValues(layersData, "visibility").map(
                          (value) => (
                            <MenubarItem
                              key={value}
                              onClick={() => {
                                table.setColumnFilters([])
                                table
                                  .getColumn("visibility")
                                  ?.setFilterValue(value)
                              }}
                            >
                              {value}
                            </MenubarItem>
                          )
                        )}
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <AddLayer />
          </div>
        </div>
        <div className="table w-full">
          <div className="overflow-hidden rounded-md border mt-8">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    {status === "loading" ? (
                      <TableCell
                        colSpan={columns?.length}
                        className="h-24 text-center"
                      >
                        Loading...
                      </TableCell>
                    ) : (
                      <TableCell
                        colSpan={columns?.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center space-x-2 py-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerManagement
