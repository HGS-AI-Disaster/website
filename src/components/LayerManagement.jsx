import React, { useState } from "react"
import { Input } from "./ui/input"
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
import { ArrowDownAZ, ArrowUpDown, TornadoIcon, Waves } from "lucide-react"
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
import { useSelector } from "react-redux"
import { Badge } from "./ui/badge"

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
    maxSize: 100,
    minSize: 10,
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Layer name</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowDownAZ />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const now = new Date()
      const date = new Date(row.getValue("created_at"))
      const diffMs = now - date
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)

      return (
        <div className="truncate max-w-[250px]">
          {diffMin < 1 && (
            <Badge
              className={
                "bg-green-50 border border-green-200 text-green-500 px-2 me-2"
              }
            >
              new
            </Badge>
          )}
          {row.getValue("layer")}
        </div>
      )
    },
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
            <ArrowDownAZ />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const category = row.getValue("category")
      switch (category) {
        case "Flood":
          return (
            <Badge
              className={
                "bg-yellow-50 text-yellow-500 border border-yellow-200"
              }
            >
              <Waves strokeWidth={2} />
              Flood
            </Badge>
          )
        case "Heavy Rain":
          return (
            <Badge
              className={"bg-blue-50 text-blue-500 border border-blue-200"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-cloud-rain-heavy-fill me-0.5"
                viewBox="0 0 16 16"
              >
                <path d="M4.176 11.032a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293m3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293m3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293m3 0a.5.5 0 0 1 .292.643l-1.5 4a.5.5 0 0 1-.936-.35l1.5-4a.5.5 0 0 1 .644-.293m.229-7.005a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973" />
              </svg>
              Heavy Rain
            </Badge>
          )
        case "Typhoon":
          return (
            <Badge
              className={
                "bg-fuchsia-50 text-fuchsia-500 border border-fuchsia-200"
              }
            >
              <TornadoIcon strokeWidth={2} />
              Typhoon
            </Badge>
          )
        case "Earthquake":
          return (
            <Badge
              className={"bg-green-50 text-green-500 border border-green-200"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-activity me-0.5"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"
                />
              </svg>
              Earthquake
            </Badge>
          )
        case "Cloud":
          return (
            <Badge
              className={
                "bg-orange-50 text-orange-500 border border-orange-200"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-cloud-fill me-0.5"
                viewBox="0 0 16 16"
              >
                <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
              </svg>
              Cloud
            </Badge>
          )
        default:
          return (
            <Badge
              className={"bg-gray-50 text-gray-500 border border-gray-200"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-building-fill me-0.5"
                viewBox="0 0 16 16"
              >
                <path d="M3 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3v-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V16h3a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm1 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5M4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5" />
              </svg>
              {category}
            </Badge>
          )
      }
    },
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
      return (
        <div>
          {new Date(row.getValue("layer_date")).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )
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
      function timeAgo(isoString) {
        const now = new Date()
        const date = new Date(isoString)

        const diffMs = now - date // selisih dalam ms
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)

        if (diffSec < 60) {
          return "Just now"
        } else if (diffMin === 1) {
          return "1 minute ago"
        } else if (diffMin < 60) {
          return `${diffMin} minutes ago`
        } else if (diffHour === 1) {
          return "1 hour ago"
        } else if (diffHour < 24) {
          return `${diffHour} hours ago`
        } else if (diffDay === 1) {
          return "1 day ago"
        } else if (diffDay < 7) {
          return `${diffDay} days ago`
        } else {
          // Lewat dari 1 minggu → tampilkan date pretty
          return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          // contoh output: "18 Sep 2025"
        }
      }

      return <div>{timeAgo(row.getValue("created_at"))}</div>
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
          <ArrowDownAZ />
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

  return (
    <div className="bg-gray-200 p-12">
      <div className="bg-gray-50 py-8 px-12 rounded-lg  overflow-x-auto">
        <div className="heading flex items-center">
          <div className="title flex-1">
            <div className="text-xl font-semibold">Layer Management</div>
            <div className="text-gray-400">Manage Layer (GeoJSON)</div>
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
                {table.getHeaderGroups().map((headerGroup) => {
                  return (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className={`text-sm ${
                              header.id === "layer" ? "w-[370px]" : ""
                            }`}
                          >
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
                  )
                })}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={`text-sm py-4 ${
                            cell.id === "layer" ? "w-[370px]" : ""
                          }`}
                        >
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
                        className=""
                      >
                        <div className="h-full flex flex-col justify-center items-center my-4">
                          <img
                            src="https://ktfdrhfhhdlmhdizorut.supabase.co/storage/v1/object/public/icons/ChatGPT%20Image%20Sep%2016,%202025,%2006_10_29%20PM.png"
                            alt=""
                            srcset=""
                            className="w-[90px] rounded-full "
                          />
                          <div className="text-gray-600 mt-2">
                            Data is empty
                          </div>
                        </div>
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
